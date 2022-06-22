var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');


var app = express();

var con = mysql.createConnection({
   host: "localhost",
   user: "nodejs",
   password: "nodejs",
   database: "nodejsSQL"
 });

 function isProductInCart(cart,id){
   for(let i=0;i<cart.length;i++){
      if(cart[i].id==id){
         return true;
      }
   }
   return false;
 }

 function calculateTotal(cart,req){
   total=0;
   for(let i=0;i<cart.length;i++){
      if(cart[i].sale_price){
         total+=(cart[i].sale_price*cart[i].quantity);
      }else{
         total+=(cart[i].price*cart[i].quantity);
      }
   }
   req.session.total=total;
   return total;
 }

//Tells the express to use static pages in public folder
app.use(express.static('public'));
//Tells express to set view engine to ejs
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({secret:"secret"}));
app.listen(3000);

//to route to pages
app.get('/Index', function(request, response) {  
    response.render('pages/Index.ejs',{result:request.session.result});
 }); 
 app.get('/brand', function(request, response) {
    response.render('pages/brand.ejs');
 }); 
 app.get('/contact', function(request, response) {
    response.render('pages/contact.ejs');
 }); 
 app.get('/about', function(request, response) {
    response.render('pages/about.ejs');
 }); 
 app.get('/special', function(request, response) {
    response.render('pages/special.ejs');
 }); 
 app.post('/remove_product',function(req,res){
   var id = req.body.id;
   var cart = req.session.cart;
   for(let i=0;i<cart.length;i++){
      if(cart[i].id==id){
         cart.splice(cart.indexOf(i),1);
      }
   }
   calculateTotal(cart,req);
   res.redirect('/cart');

 });
 
 app.post('/edit_product_quantity',function(req,res){
   var id=req.body.id;
   var increase_btn= req.body.increase_product_quantity;
   var decrease_btn = req.body.decrease_product_quantity;
   var quantity = req.body.quantity;
   var cart = req.session.cart;

   if(increase_btn){
      for(let i=0;i<cart.length;i++){
         if(cart[i].id==id && cart[i].quantity>0){
            cart[i].quantity=parseInt(cart[i].quantity)+1;
         }
      }
   } else if(decrease_btn){
      for(let i=0;i<cart.length;i++){
         if(cart[i].id==id && cart[i].quantity>0){
            cart[i].quantity=parseInt(cart[i].quantity)-1;
         }
      }
   }
   calculateTotal(cart,req);
   res.redirect('/cart');
 });
 app.post('/add_to_cart',function(req,res){
   console.log(req.body);
    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var product = {id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image};
    //console.log(product);
    if(req.session.cart){
      var cart = req.session.cart;
      if(!isProductInCart(cart, id)){
         cart.push(product);
      }
    }else{
      req.session.cart = [product];
      var cart = req.session.cart;
    }

    //calculate total 
    calculateTotal(cart,req);

    //return to cart page
    res.redirect('/cart');
 });
 app.get('/cart',function(req,res){
   var cart=req.session.cart;
   var total=req.session.total;
   //console.log(cart);
   res.render('pages/cart',{cart:cart,total:total});
 });
//create server
app.get('/',function(req,res){
    con.connect(function(err){
        con.query('select * from products;',function(err, result){
            if (err) throw err;
            req.session.result=result;
            //In below code {result:result} means we are passing result object to index.ejs
            res.render('pages/Index.ejs',{result:result}); 
        });
    });
});

app.get('/checkout',function(req,res){
   var total = req.session.total;
   res.render('pages/checkout',{total:total});
});
app.post('/place_order',function(req,res){
   var name = req.body.name;
   var email = req.body.email;
   var phone = req.body.phone;
   var city = req.body.city;
   var address = req.body.address;
   var cost = req.session.total;
   var status = "not paid";
   var date = new Date();
   var product_ids = "";
   var cart = req.session.cart;
   for(let i=0;i<cart.length;i++){
      product_ids = product_ids + ","+ cart[i].id;
   }
   con.connect(function(err){
      var query = "insert into orders(cost,name,email,status,city,address,phone,date,product_ids) values ?;";
      var values=[[cost,name,email,status,city,address,phone,date,product_ids]];
      con.query(query,[values],function(err, result){
          if (err) throw err;
          res.redirect('/payment'); 
      });
  });
});

app.get('/payment',function(req,res){
   var total = req.session.total;
   res.render('pages/payment',{total:total});
});