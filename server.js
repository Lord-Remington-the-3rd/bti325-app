/*********************************************************************************
* BTI325 – Assignment 3
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Valy Osman 
* Student ID: 184017218 
* Date: 10/30/2022
*
*
********************************************************************************/ 


const express = require("express");
const app = express();
const path = require("path");
const data = require("./data-service");
const multer = require("multer");
const fs = require('fs');
const exphbs = require("express-handlebars");
const {engine} = require("express-handlebars");
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  const route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
 });

app.engine('.hbs', engine({ extname: '.hbs', helpers: {
  navLink: function(url, options){
    return '<li' +
    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
    '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>';
   },
   
   equal: (lvalue, rvalue, options) => {
    if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
    return options.inverse(this);
    } else {
    return options.fn(this);
    }
   } 
  }
  , defaultLayout: 'main'}));

app.set('view engine', '.hbs');

const HTTP_PORT = 8080;

const storage = multer.diskStorage({
  destination: 
    "./public/images/uploaded",
  filename: 
    (req, f, c) => {
      c(null
       , Date.now() + path.extname(f.originalname));
  }
});

const upload = multer({storage: storage});

let onHttpStart = () => {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.get("/", (req,res) => {
  res.render('home');
});

app.get("/about", (req,res) => {
  res.render('about');
});

app.get("/employees", (req,res) => {
  if(req.query.status){
    const s= req.query.status;
    data.getEmployeesByStatus(s)
    .then((data) => { 
      res.render("employees", {employees: data});
    })
    .catch((err) => { 
      res.render({message: "Empty Results"});
    });
  } else if (req.query.department){
    const d = req.query.department;
    data.getEmployeesByDepartment(d)
    .then((data) => { 
      res.render("employees", {employees: data}); 
    })
    .catch((err) => { 
      res.render({message: "Empty Results"});
    });
  } else if (req.query.manager){
    const m = req.query.manager;
    data.getEmployeesByManager(m)
    .then((data) => { 
      res.render("employees", {employees: data}); 
    })
    .catch((err) => { 
      res.render({message: "Empty Results"});
    });
  } else {
    data.getAllEmployees()
    .then((data) => { 
      res.render("employees", {employees: data});
    })
    .catch((err) => { 
      res.render({message: "Empty Results"}); 
    });
  }
});

app.get("/departments", (req,res) => {
  data.getDepartments()
  .then((data) => { 
    res.render("departments", {departments: data}); 
  })
  .catch((err) => { 
    res.json({message: err});
  });
});

app.get("/managers", (req,res) => {
  data.getManagers()
  .then((data) => { 
    res.json(data) 
  })
  .catch((err) => { 
    res.json({message: err}); 
  });
});

app.get("/images/add", (req,res) => {
  res.render('addImage');
});

app.post("/images/add", upload.single("imageFile"), (req, res) => {
  res.redirect("/images");
});

app.get("/images", (req,res) => {
  fs.readdir("./public/images/uploaded", (err, items) => {
    res.render("images",  { data: items, title: "Images" });
  });
});

app.get("/employees/add", (req,res) => {
  res.render('addEmployee');
});

app.post("/employees/add", (req,res) => {
  data.addEmployee(req.body)
  .then(() => { 
    res.redirect("/employees"); 
  })
  .catch((err) => { 
    res.json({message: err});
  });
});

app.get('/employee/:employeeNum', (req, res) => {
  data.getEmployeeByNum(req.params.employeeNum)
  .then((data) => { 
    res.render("employee",{employee:data});
  })
  .catch(()=>{
    res.render("employee",{message:"no results"});
  });
});

app.post("/employee/update", (req, res) => {
  data.updateEmployee(req.body)
  .then((data) => {
    res.redirect("/employees");
  })
  .catch((err) => { 
    res.render({message: "Empty Results"});
  });
});

app.get("*", (req,res) => {
  res.send("Error 404: Page not found.");
});

data.initialize()
.then(() => {
  app.listen(process.env.PORT || HTTP_PORT, onHttpStart);
})
.catch((reason) => {
  console.log(reason);
});