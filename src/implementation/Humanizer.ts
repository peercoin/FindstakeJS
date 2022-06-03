export class Humanizer {
  static DEFAULT_WORDLIST = [
    "ack",
    "alabama",
    "alanine",
    "alaska",
    "alpha",
    "angel",
    "apart",
    "april",
    "arizona",
    "arkansas",
    "artist",
    "asparagus",
    "aspen",
    "august",
    "autumn",
    "avocado",
    "bacon",
    "bakerloo",
    "batman",
    "beer",
    "berlin",
    "beryllium",
    "black",
    "blossom",
    "blue",
    "bluebird",
    "bravo",
    "bulldog",
    "burger",
    "butter",
    "california",
    "carbon",
    "cardinal",
    "carolina",
    "carpet",
    "cat",
    "ceiling",
    "charlie",
    "chicken",
    "coffee",
    "cola",
    "cold",
    "colorado",
    "comet",
    "connecticut",
    "crazy",
    "cup",
    "dakota",
    "december",
    "delaware",
    "delta",
    "diet",
    "don",
    "double",
    "early",
    "earth",
    "east",
    "echo",
    "edward",
    "eight",
    "eighteen",
    "eleven",
    "emma",
    "enemy",
    "equal",
    "failed",
    "fanta",
    "fifteen",
    "fillet",
    "finch",
    "fish",
    "five",
    "fix",
    "floor",
    "florida",
    "football",
    "four",
    "fourteen",
    "foxtrot",
    "freddie",
    "friend",
    "fruit",
    "gee",
    "georgia",
    "glucose",
    "golf",
    "green",
    "grey",
    "hamper",
    "happy",
    "harry",
    "hawaii",
    "helium",
    "high",
    "hot",
    "hotel",
    "hydrogen",
    "idaho",
    "illinois",
    "india",
    "indigo",
    "ink",
    "iowa",
    "island",
    "item",
    "jersey",
    "jig",
    "johnny",
    "juliet",
    "july",
    "jupiter",
    "kansas",
    "kentucky",
    "kilo",
    "king",
    "kitten",
    "lactose",
    "lake",
    "lamp",
    "lemon",
    "leopard",
    "lima",
    "lion",
    "lithium",
    "london",
    "louisiana",
    "low",
    "magazine",
    "magnesium",
    "maine",
    "mango",
    "march",
    "mars",
    "maryland",
    "massachusetts",
    "may",
    "mexico",
    "michigan",
    "mike",
    "minnesota",
    "mirror",
    "mississippi",
    "missouri",
    "mobile",
    "mockingbird",
    "monkey",
    "montana",
    "moon",
    "mountain",
    "muppet",
    "music",
    "nebraska",
    "neptune",
    "network",
    "nevada",
    "nine",
    "nineteen",
    "nitrogen",
    "north",
    "november",
    "nuts",
    "october",
    "ohio",
    "oklahoma",
    "one",
    "orange",
    "oranges",
    "oregon",
    "oscar",
    "oven",
    "oxygen",
    "papa",
    "paris",
    "pasta",
    "pennsylvania",
    "pip",
    "pizza",
    "pluto",
    "potato",
    "princess",
    "purple",
    "quebec",
    "queen",
    "quiet",
    "red",
    "river",
    "robert",
    "robin",
    "romeo",
    "rugby",
    "sad",
    "salami",
    "saturn",
    "september",
    "seven",
    "seventeen",
    "shade",
    "sierra",
    "single",
    "sink",
    "six",
    "sixteen",
    "skylark",
    "snake",
    "social",
    "sodium",
    "solar",
    "south",
    "spaghetti",
    "speaker",
    "spring",
    "stairway",
    "steak",
    "stream",
    "summer",
    "sweet",
    "table",
    "tango",
    "ten",
    "tennessee",
    "tennis",
    "texas",
    "thirteen",
    "three",
    "timing",
    "triple",
    "twelve",
    "twenty",
    "two",
    "uncle",
    "undress",
    "uniform",
    "uranus",
    "utah",
    "vegan",
    "venus",
    "vermont",
    "victor",
    "video",
    "violet",
    "virginia",
    "washington",
    "west",
    "whiskey",
    "white",
    "william",
    "winner",
    "winter",
    "wisconsin",
    "wolfram",
    "wyoming",
    "xray",
    "yankee",
    "yellow",
    "zebra",
    "zulu",
  ];

  static xor(iterable: number[]): number {
    let start = 0;
    for (let index = 0, _len = iterable.length; index < _len; index++) {
      let el = iterable[index];
      start ^= el;
    }
    return start;
  }

  static bytes(digest: string): number[] {
    let zips = [];

    for (let index = 0; index < digest.length; index++) {
      if (index !== digest.length - 1 && index % 2 === 0) {
        let pair = [digest[index], digest[index + 1]];
        zips.push(pair);
      }
    }

    let bytearr = [] as number[];

    for (let zipindex = 0; zipindex < zips.length; zipindex++) {
      bytearr.push(parseInt(zips[zipindex].join(""), 16));
    }
    return bytearr;
  }

  static compress(bytes: number[], target: number): number[] {
    let seg_size = Number(bytes.length / target);
    let segments = [] as Array<Array<number>>;

    let indexBackwards = 0;
    for (
      let index = 0;
      0 <= target ? indexBackwards < target : indexBackwards > target;
      index = 0 <= target ? ++indexBackwards : --indexBackwards
    ) {
      const arrnumber = bytes.slice(index * seg_size, (index + 1) * seg_size);
      segments.push(arrnumber);
    }

    let last = segments[target - 1];
    last.push.apply(last, bytes.slice(target * seg_size));

    let compressedarr = [] as Array<number>;

    for (let index = 0; index < segments.length; index++) {
      compressedarr.push(this.xor(segments[index]));
    }
    return compressedarr;
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static toReadableId(hash: string, words = 5, separator = "_"): string {
    if (words == null) {
      words = 4;
    }
    if (separator == null) {
      separator = "-";
    }
    if (words < 1 || words > 19) {
      throw "Words must be between 1 and 19";
    }
    let in_bytes = this.bytes(
      hash
        .slice(0)
        .split("")
        .map((c) => {
          return c.charCodeAt(0).toString(16);
        })
        .join("")
    );

    let compressed = this.compress(in_bytes, words);
    let result = [] as Array<string>;
    for (let index = 0; index < compressed.length; index++) {
      result.push(this.capitalize(this.DEFAULT_WORDLIST[compressed[index]]));
    }
    return result.join(separator);
  }
}
