process.env.NODE_ENV = "test";

const request = require("supertest")
const app = require("../app")
const db = require("../db")
const slugify = require("slugify")

let testCompany;
let testInvoices;
beforeEach(async()=>{
  const companyResult = await db.query(`INSERT INTO companies (code, name, description) 
                                 VALUES ('orange','orangeC','We grow and sell orange') 
                                 RETURNING code, name, description`);
  const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt)
                                        VALUES ('orange', 6969)
                                        RETURNING *`)
  testCompany = companyResult.rows[0];
  testInvoices = invoiceResult.rows;
});
afterEach(async()=>{
  await db.query(`DELETE FROM companies`)
  await db.query(`DELETE FROM invoices`)
})
afterAll(async()=>{
  await db.end()
})


describe("GET /companies", ()=>{
  test("Get a list of companies", async()=>{
    const res = await request(app).get("/companies")
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({companies: [testCompany]})
  })
})


describe("GET /companies/:code", ()=>{
  test("Get a single company", async()=>{
    const res = await request(app).get(`/companies/${testCompany.code}`)
    expect(res.statusCode).toBe(200)
    testCompany.invoices = testInvoices.map(inv=>inv.id)
    expect(res.body).toEqual({company: testCompany})
  })
})


describe("POST /companies", ()=>{
  test("Adds a single company", async()=>{
    const res = await request(app).post("/companies").send({code:"banana", name:"bananaC", description:"we grow and sell banana"})
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({company:{code:"banana", name:"bananaC", description:"we grow and sell banana"}})
  })
})


describe("PATCH /companies/:code", ()=>{
  test("Updates a single company", async()=>{
    const res = await request(app).patch(`/companies/${testCompany.code}`)
                                  .send({name:"bananaC", description:"we grow and sell banana"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({company:{code:`${testCompany.code}`, name:"bananaC", description:"we grow and sell banana"}})
  });
  test("Invalid company code", async()=>{
    const res = await request(app).patch(`/companies/invalidcode`)
                                  .send({name:"bananaC", description:"we grow and sell banana"})
    expect(res.statusCode).toBe(404)
  })
})


describe("DELETE /companies/:code",()=>{
  test("Delete a single company", async()=>{
    const res = await request(app).delete(`/companies/${testCompany.code}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({status:"deleted"})
  })
  test("Invalid company code", async()=>{
    const res = await request(app).delete(`/companies/invalidcompanycode`)
    expect(res.statusCode).toBe(404)
  })
})