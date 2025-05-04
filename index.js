import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const port = 3000;
let countryCode = [];

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "password",
  port: 5432,
  max: 10,              // opcional: número máximo de conexiones
  idleTimeoutMillis: 30000
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//lee los country_codes guardados y renderiza
app.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT country_code FROM visited_countries"
    );
    countryCode = rows.map(r => r.country_code);
    console.log(countryCode)
    res.render("index", {
      countries: countryCode,
      total: countryCode.length
    });
  } catch (error) {
    console.error("Error en GET /:", error.stack);
    res.status(500).send("Error de base de datos");
  }
});

//busca el código y lo guarda, luego redirige a "/"
app.post("/add", async (req, res) => {
  const countryAdded = req.body.country.trim();

  try {
    const { rows } = await pool.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = LOWER($1)", [countryAdded]
    );
    if (rows.length) {
      const code = rows[0].country_code;
      await pool.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)", [code]
      );
    } else {
      res.render("index.ejs", {
        countries: countryCode,
        total: countryCode.length,
        error: "Country name does not exist, try again.",
      });
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error en POST /add:", error.stack);
    res.render("index.ejs", {
      countries: countryCode,
      total: countryCode.length,
      error: "Country has already been added, try again.",
    });
  }
});


app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
