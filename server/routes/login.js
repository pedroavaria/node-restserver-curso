const express = require('express')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


const Usuario = require('../models/usuario')

const app = express()


app.post('/login', (req, res) => {

    let body = req.body
    Usuario.findOne({ email: body.email }, (err, UsuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })
        }

        if (!UsuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrectos'
                }
            })
        }


        if (!bcrypt.compareSync(body.password, UsuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrectos'
                }
            })
        }
        let token = jwt.sign({
            usuario: UsuarioDB
        }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN })


        res.json({
            ok: true,
            usuario: UsuarioDB,
            token
        })

    })
})

// Configuraciones de google

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }


}


app.post('/google', async (req, res) => {
    let token = req.body.idtoken
    let googleuser = await verify(token).catch(e => {
        return res.status(403).json({
            ok: false,
            err: {
                message: "Token no Valido"
            }
        })
    })
    if (!googleuser.email) {
        return
    }
    Usuario.findOne({ email: googleuser.email }, (err, UsuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })
        }
        if (UsuarioDB) {
            if (UsuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Debe usar su autenticacion normal'
                    }
                })
            } else {
                let token = jwt.sign({
                    usuario: UsuarioDB
                }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN })

                return res.json({
                    ok: true,
                    usuario: UsuarioDB,
                    token
                })
            }
        } else {
            // Si el usuario no existe
            let usuario = new Usuario();

            usuario.nombre = googleuser.nombre
            usuario.email = googleuser.email
            usuario.img = googleuser.img
            usuario.google = googleuser.google
            usuario.password = ':)'

            usuario.save((err, UsuarioDB) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    })
                }

                let token = jwt.sign({
                    usuario: UsuarioDB
                }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN })


                res.json({
                    ok: true,
                    usuario: UsuarioDB,
                    token
                })

            })

        }

    })
})



module.exports = app