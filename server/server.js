require("./config/config")
const express = require('express')
const mongoose = require('mongoose');
const path = require('path')
const app = express()
const bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(require('./routes/index'))

// parse application/json
app.use(bodyParser.json())


//habilitar carpeta public

app.use( express.static( path.resolve(__dirname ,'../public')) )


mongoose.connect(process.env.URLDB, 
    {useNewUrlParser: true, useCreateIndex: true,useUnifiedTopology:true,useFindAndModify:false} , (err,res) => {
    if (err) throw err
    console.log('Base de datos online ');
})

app.listen(process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${process.env.PORT}`);
})