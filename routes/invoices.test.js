process.env.NODE_ENV = "test";

const request = require("supertest")
const app = require("../app")
const db = require("../db")


let testCompany;
let testInvoice;
beforeEach(async()=>{
  await db.query("DELETE FROM companies")
  await db.query("DELETE FROM invoices")
  const companyResult = await db.query(`INSERT INTO companies (code, name, description) 
                                 VALUES ('orange','orangeC','We grow and sell orange') 
                                 RETURNING code, name, description`);
  const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt)
                                        VALUES ('orange', 6969)
                                        RETURNING *`)
  testCompany = companyResult.rows[0];
  testInvoice = invoiceResult.rows[0]
});
afterEach(async()=>{
  await db.query(`DELETE FROM companies`)
  await db.query("DELETE FROM invoices")
})
afterAll(async()=>{
  await db.end()
})


describe("GET /invoices", ()=>{
  test("Get a list of invoices",async()=>{
    const res = await request(app).get("/invoices")
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({invoices:[{  "add_date": "2021-02-24T05:00:00.000Z",
                                        "amt": 6969,
                                        "comp_code": "orange",
                                        "id": expect.any(Number), 
                                        "paid": false,
                                        "paid_date": null,      
    }]})
  })
})


describe("GET /invoices/:id", ()=>{
  test("Get a single invoice from :id", async()=>{
    const res = await request(app).get(`/invoices/${testInvoice.id}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({invoice:{  "add_date": "2021-02-24T05:00:00.000Z",
                                           "amt": 6969,
                                           "comp_code": "orange",
                                           "id": expect.any(Number), 
                                           "paid": false,
                                           "paid_date": null,      
    }})
  })
  test("Invalid Id", async()=>{
    const res = await request(app).get("/invoices/0")
    expect(res.statusCode).toBe(404)
  })
})


describe("POST /invoices", ()=>{
  test("post an invoice to /invoices", async()=>{
    const res = await request(app).post("/invoices").send({comp_code:"orange", amt:1337})
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({invoice:{    "add_date": "2021-02-24T05:00:00.000Z",
                                           "amt": 1337,
                                           "comp_code": "orange",
                                           "id": expect.any(Number), 
                                           "paid": false,
                                           "paid_date": null,      
    }})
  });
});


describe("PATCH /invoices/:id", ()=>{
  test("Update a single invoice", async()=>{
    const res = await request(app).patch(`/invoices/${testInvoice.id}`).send({amt:1,paid:true})
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({invoice:{    "add_date": "2021-02-24T05:00:00.000Z",
                                           "amt": 1,
                                           "comp_code": "orange",
                                           "id": expect.any(Number), 
                                           "paid": true,
                                           "paid_date": expect.any(String),      
    }})
})})


describe("DELETE /invoices/:id", ()=>{
  test("Delete a single invoice", async()=>{
    const res = await request(app).delete(`/invoices/${testInvoice.id}`)
    expect(res.statusCode).toBe(200)
  })
  test("Invalid invoice id", async()=>{
    const res = await request(app).delete('/invoices/0')
    expect(res.statusCode).toBe(404)
  })
})