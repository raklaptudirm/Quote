const fs = require("fs")
const chalk = require("chalk")
const readline = require("readline")

type QuoteBlockType = "emphasis" | "normal"

const EMPHASIS: QuoteBlockType = "emphasis"
const NORMAL: QuoteBlockType = "normal"

interface QuoteFormat {
  type: QuoteBlockType
  data: string
}

interface Quote {
  data: QuoteFormat[]
  favourite: boolean
}

interface QuoteString {
  data: string
  favourite: boolean
}

interface Database {
  quotes: QuoteString[]
  people: string[]
}

function update() {
  fs.writeFileSync(`${__dirname}/../database.json`, JSON.stringify(database))
}

function is(string: string, regexp: RegExp): boolean {
  let match: RegExpExecArray = regexp.exec(string)!
  if (string === "") return false
  if (match && match[0] === string) return true
  return false
}

function parseQuote(qString: QuoteString): Quote {
  const quote: string = qString.data

  let emphasis: boolean = false
  let action: boolean = false

  let string: string = ""

  let format: QuoteFormat[] = []

  const quoteLength: number = quote.length

  for (let i: number = 0; i < quoteLength; i++) {
    let char: string = quote[i]
    if (char === "{" && is(quote.substring(i, i + 3), /{[A-F]}/)) {
      string += variables[quote[i + 1]]
      i += 2
      continue
    }

    if (emphasis) {
      if (char === ">") {
        format.push({ type: EMPHASIS, data: string })
        string = ""
        emphasis = false
      } else {
        string += char
      }
    } else if (action) {
      string += char

      if (char === "*") {
        format.push({ type: EMPHASIS, data: string })
        string = ""
        action = false
      }
    } else {
      if (char === "<") {
        if (string !== "") {
          format.push({ type: NORMAL, data: string })
          string = ""
        }

        emphasis = true
      } else if (char === "*") {
        if (string !== "") {
          format.push({ type: NORMAL, data: string })
          string = ""
        }

        action = true
        string += char
      } else {
        string += char
      }
    }
  }

  if (string !== "") {
    format.push({ type: NORMAL, data: string })
    string = ""
  }

  return { data: format, favourite: qString.favourite }
}

function printQuote(quote: Quote, id: number): void {
  console.log(
    `${chalk.blue.bold(`[Quote ID: ${id}]`)}${
      quote.favourite ? chalk.blue.bold(" ♥") : ""
    }`
  )
  console.log(formatQuote(quote.data))
}

function formatQuote(quote: QuoteFormat[]): string {
  return quote
    .map(item => {
      if (item.type === EMPHASIS) return chalk.yellow.bold(item.data)
      if (item.type === NORMAL) return item.data
      return chalk.bold(variables[item.data])
    })
    .join("")
}

function random(limit: number): number {
  const rand = require("crypto").randomInt
  const packets: number = Math.floor(limit / 10)

  let packet: number

  if (packets > 10) {
    packet = random(packets)
  } else {
    packet = rand(0, packets)
  }

  return packet * 10 + rand(0, 10)
}

async function input(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(query, (value: string) => {
      rl.close()
      resolve(value)
    })
  })
}

function parseInput(str: string): string {
  return str.replace(/\\n/g, "\n")
}

function assert(num: number | string): number {
  if (typeof num === "number") {
    if (args.length !== num + 1) {
      console.log(
        chalk.red.bold(
          `error: Expected ${num} arg(s), received ${args.length - 1}`
        )
      )
      process.exit(0)
    }
  } else {
    const returns: number = parseInt(num)

    if (!is(num, /[0-9]+/) || !Number.isFinite(returns)) {
      console.log(chalk.red.bold(`error: ${num} is not a valid number.`))
      process.exit(0)
    }

    return returns
  }

  return 0
}

function assertId(id: number) {
  if (id < 0 || id >= database.quotes.length) {
    console.log(chalk.red.bold(`${id + 1} is not a valid quote id.`))
    process.exit(0)
  }
}

const args: string[] = process.argv.slice(2)

let database: Database = JSON.parse(
  fs.readFileSync(__dirname + "/../database.json")
)
let variables: any = database.people
let index: number = 0

switch (args[0]) {
  case undefined:
    index = random(database.quotes.length)
    printQuote(parseQuote(database.quotes[index]), index + 1)
    break
  case "--at":
  case "-a":
    assert(1)
    index = assert(args[1]) - 1
    assertId(index)

    printQuote(parseQuote(database.quotes[index]), index + 1)
    break
  case "--edit":
  case "-e":
    assert(1)
    index = parseInt(args[1]) - 1
    assertId(index)

    printQuote(parseQuote(database.quotes[index]), index + 1)
    input("Enter edited quote: \n").then((value: string) => {
      console.log()
      printQuote(parseQuote({ data: parseInput(value), favourite: false }), 1)
    })
    break
  case "--delete":
  case "-d":
    assert(1)
    index = assert(args[1]) - 1
    assertId(index)

    printQuote(parseQuote(database.quotes[index]), index + 1)
    input("\nAre you sure you want to delete this quote (yes): ").then(
      (ok: string) => {
        if (ok.toLowerCase() === "yes") {
          database.quotes.splice(index, 1)
          update()
          console.log(chalk.green.bold(`Deleted quote at ${index + 1}.`))
        } else {
          console.log(chalk.green.bold("Delete aborted."))
        }
      }
    )
    break
  case "--new":
  case "-n":
    assert(0)
    input("Enter your quote:\n").then((value: string) => {
      value = parseInput(value)
      printQuote(parseQuote({ data: value, favourite: false }), 1)
      input("\nIs the quote ok (yes): ").then((ok: string) => {
        if (ok.toLowerCase() === "yes") {
          database.quotes.push({ data: value, favourite: false })
          update()
          console.log(
            chalk.green.bold(`Added quote at ${database.quotes.length}.`)
          )
        } else {
          console.log(chalk.green.bold("Add aborted."))
        }
      })
    })
    break
  default:
}
