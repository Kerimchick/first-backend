const express = require("express")
const fs = require("fs");
const {customAlphabet} = require("nanoid");
const server = express()

server.use(express.json())

const readFile = (fileName) => {
    try {
       return  JSON.parse(fs.readFileSync(`./tasks/${fileName}.json`, "utf8"))
    } catch (e) {
        return []
    }
}

server.get("/api/tasks/:category/:timespan", (req, res) => {
    const data = readFile(req.params.category)
    const duration = {
        "day" : 1000 * 60 * 60 * 24,
        "week" : 1000 * 60 * 60 * 24 * 7,
        "month" : 1000 * 60 * 60 * 24 * 7 * 30
    }
    const filteredData = data.filter(el => +new Date() - el._createdAt < duration[req.params.timespan])
    res.json(filteredData)
})
server.get("/api/tasks/:category", (req, res) => {
    const data = readFile(req.params.category)
    const filteredData = data.filter(item => !item._isDeleted)
        .map(el => {
            delete el._createdAt
            delete el._deletedAt
            return el
        })
    res.json(filteredData)
})
server.post("/api/tasks/:category", (req, res) =>{
    const data = readFile(req.params.category)
    const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5)
    const newTask = {
        "taskId" : nanoid(),
        "title" : req.body.title,
        "_isDeleted" : false,
        "_createdAt" : +new Date(),
        "_deletedAt" : null,
        "status" : "new"
    }
    const addNewTask = [...data, newTask]
    fs.writeFileSync(`./tasks/${req.params.category}.json`, JSON.stringify(addNewTask, null, 2))
    res.json({status : "successfully"})
})
server.delete("/api/tasks/:category/:id", (req, res) =>{
    const data = readFile(req.params.category)
    const stateTask = data.map(el => el.taskId === req.params.id ? {...el, _isDeleted : true} : el)
    fs.writeFileSync(`./tasks/${req.params.category}.json`, JSON.stringify(stateTask, null, 2))
    res.json({status : "successfully"})
})
server.patch("/api/tasks/:category/:id", (req,res) => {
    const states = ["done", "new", "in progress", "blocked"]
    const data = readFile(req.params.category)
    const find = states.find(el => el === req.body.status)
    const updatedTask = data.map(el => {
        if(el.taskId === req.params.id && find) {
           return  {...el, status : req.body.status}
        } else {
            res.status(501).json({status: "error", "message" : "incorrect status"})
            return el
        }
    })
    fs.writeFileSync(`./tasks/${req.params.category}.json`, JSON.stringify(updatedTask, null, 2))
    res.json({status : "successfully"})
})

server.listen(process.env.PORT || 8000, () => {
    console.log("server is started")
})
