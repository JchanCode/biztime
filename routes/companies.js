const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")



/* 
GET /companies return json list of companies in db
 */ 
router.get("/", async(req, res, next)=>{
  try {
    const results = await db.query(`SELECT * FROM companies`)
    return res.json({companies: results.rows})
  } catch (error) {
    return next(error)
  }
});


/* 
GET /companies/:code return json single company
 */ 
router.get("/:code", async(req, res, next)=>{
  try {
    const {code} = req.params;
    const compyResults = await db.query(`SELECT * FROM companies WHERE code=$1`,[code]);
    const invResults = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`,[code]);
    if (compyResults.rows.length === 0) {
      throw new ExpressError (`Can't find company with code: ${code}`, 404)
    };
    const company = compyResults.rows[0];
    const invoices = invResults.rows;
    company.invoices = invoices.map(inv=>inv.id);
    return res.json({company: company});
  } catch (error) {
    return next(error);
  };
});


/* 
POST /companies adds a single company
 */ 
router.post("/", async(req, res, next)=>{
  try {
    const {code, name, description} = req.body;
    const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING code, name, description`,[code, name, description]);
    return res.json({company: results.rows[0]});
  } catch (error) {
    return next(error);
  };
});


/* 
PATCH /companies/:code update a company
 */ 
router.patch("/:code", async(req, res, next)=>{
  try {
    const {code} = req.params;
    const {name, description} = req.body;
    const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,[name, description, code]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Cant find company with code:${code}`, 404)
    }
    return res.json({company: results.rows[0]});
  } catch (error) {
    return next(error);
  };
});


/* 
DELETE /companies/:code delete a single company
 */ 
router.delete("/:code", async(req, res, next)=>{
  try {
    const {code} = req.params;
    const companyCheck = await db.query(`SELECT * FROM companies WHERE code=$1`,[code])
    if ( companyCheck.rows.length === 0) {
      throw new ExpressError(`Can't find company with code:${code}`, 404)
    };
    const results = await db.query(`DELETE FROM companies WHERE code=$1`,[code]);
    return res.json({status: "deleted"});
  } catch (error) {
    return next(error);
  };
});



module.exports = router