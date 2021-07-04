const fs = require("fs")
const chalk = require("chalk")

type QuoteBlockType = "emphasis" | "normal"

const EMPHASIS: QuoteBlockType = "emphasis"
const NORMAL: QuoteBlockType = "normal"

interface QuoteFormat {
	type: QuoteBlockType,
	data: string
}

interface Quote {
	data: QuoteFormat[],
	favourite: boolean
}

interface QuoteString {
  data: string,
  favourite: boolean
}

interface Database {
  quotes: QuoteString[],
  people: string[]
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
  console.log(`${chalk.blue.bold(`[Quote ID: ${id}]`)}${quote.favourite ? chalk.blue.bold(" ♥") : ""}`)
  console.log(formatQuote(quote.data))
}

function formatQuote(quote: QuoteFormat[]): string {
  return quote.map(item => {
    if (item.type === EMPHASIS)
      return chalk.yellow.bold(item.data)
    if (item.type === NORMAL)
      return item.data
    return chalk.bold(variables[item.data])
  }).join("")
}

function random (limit: number): number {
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

const args: string[] = process.argv.slice(2)

let database: Database = JSON.parse(fs.readFileSync(__dirname + "/../database.json"))
let variables: any = database.people

switch (args[0]) {
	case undefined:
    const index: number = random(database.quotes.length)
    printQuote(parseQuote(database.quotes[index]), index + 1)
}
