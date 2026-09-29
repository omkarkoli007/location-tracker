require("dotenv").config({ override: true })

const DEFAULT_TOKEN = "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"

module.exports = {
    port: Number(process.env.PORT || 6589),
    username: process.env.USERNAME || "admin",
    password: process.env.PASSWORD || "admin",
    token: process.env.TOKEN || DEFAULT_TOKEN
}