const express = require("express")
const fs = require("fs");
const {customAlphabet} = require("nanoid");
const server = express()

server.use(express.json())

const readFile = () => {
    try {
       return  JSON.parse(fs.readFileSync(`./tasks/shop.json`, "utf8"))
    } catch (e) {
        return []
    }
}
const writeFile = (data) => {
    fs.writeFileSync(`./tasks/shop.json`, JSON.stringify(data, null, 2))
}

server.get("/api/tasks/:timespan", (req, res) => {
    const data = readFile()
    const duration = {
        "day" : 1000 * 60 * 60 * 24,
        "week" : 1000 * 60 * 60 * 24 * 7,
        "month" : 1000 * 60 * 60 * 24 * 7 * 30
    }
    const filteredData = data.filter(el => +new Date() - el._createdAt < duration[req.params.timespan])
    res.json(filteredData)
})
server.get("/api/tasks", (req, res) => {
    const data = readFile()
    const filteredData = data.filter(item => !item._isDeleted)
        .map(el => {
            delete el._createdAt
            delete el._deletedAt
            return el
        })
    res.json(filteredData)
})
server.post("/api/tasks", (req, res) =>{
    const data = readFile()
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
    writeFile( addNewTask)
    res.json(newTask)
})
server.delete("/api/tasks/:id", (req, res) =>{
    const data = readFile()
    const stateTask = data.map(el => el.taskId === req.params.id ? {...el, _isDeleted : true, _deletedAt: +new Date()} : el)
    writeFile( stateTask)
    res.json(stateTask.filter(el => el.taskId === req.params.id))
})
server.patch("/api/tasks/:id", (req,res) => {
    const states = ["done", "new", "in progress", "blocked"]
    if(states.includes(req.body.status)){
        const data = readFile()
        const updatedTask = data.map(el => el.taskId === req.params.id ? {...el, status : req.body.status} : el)
        writeFile( updatedTask)
            res.json(updatedTask.filter(el => el.taskId === req.params.id))
    } else {
        res.status(501).json({status: "error", "message" : "incorrect status"})
    }
})
server.listen(process.env.PORT || 8000, () => {
    console.log("server is started")
})
