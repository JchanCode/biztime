const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")



/* 
GET /invoices return json list of invoices in db
 */ 
router.get("/", async(req, res, next)=>{
  try {
    const results = await db.query(`SELECT * FROM invoices`)
    return res.json({invoices: results.rows})
  } catch (error) {
    return next(error)
  }
});


/* 
GET /invoices return json list of invoices in db
 */ 
router.get("/:id", async(req, res, next)=>{
  try {
    const {id} = req.params;
    const results = await db.query(`SELECT * FROM invoices WHERE id=$1`,[id])
    if (results.rows.length === 0 ) {
      throw new ExpressError(`Can't find invoices with id:${id}`,404)
    }
    return res.json({invoice: results.rows[0]})
  } catch (error) {
    return next(error)
  }
});


/* 
POST /invoices adds an invoice
 */ 
router.post("/", async(req, res, next)=>{
  try {
    const {comp_code, amt} = req.body;
    const results = await db.query(`INSERT INTO invoices (comp_code, amt)
                                    VALUES ($1,$2) RETURNING *`,[comp_code, amt]);
    return res.status(201).json({invoice: results.rows[0]})
  } catch (error) {
    return next(error)
  }
});


/* 
PATCH /invoices/:id  Updates an invoice
 */ 
router.patch("/:id", async(req, res, next)=>{
  try {
    const {id} = req.params;
    const {amt, paid} = req.body;
    let paidToday = null;
    const invoicePaid = await db.query("SELECT paid FROM invoices WHERE id=$1",[id]);
    if (invoicePaid.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id:${id}`, 404)
    }
    const invoicePaidDate = invoicePaid.rows[0].paid_date;

    if (!invoicePaidDate && paid) {
      paidToday = new Date()
    } else if (!paid) {
      paidToday = null
    } else {
      paidToday = invoicePaidDate
    };

    const result = await db.query(`UPDATE invoices
                                   SET amt=$1, paid=$2, paid_date=$3
                                   WHERE id=$4
                                   RETURNING *`,[amt, paid, paidToday, id])
    return res.json({invoice: result.rows[0]})
  } catch (error) {
    return next(error)
  };
});


/* 
DELETE /invoices/:id  DELETE an invoice
 */ 
router.delete("/:id", async(req, res, next)=>{
  try {
    const {id} = req.params;
    const invoiceCheck = await db.query(`SELECT * FROM invoices WHERE id=$1`,[id])
    if ( invoiceCheck.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id:${id}`, 404)
    };
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`,[id]);
    return res.json({status: "deleted"});
  } catch (error) {
    return next(error);
  };
});



module.exports = router;