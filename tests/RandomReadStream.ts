import { Readable, ReadableOptions } from "stream";
import { randomBytes } from "crypto";

const bufferSize = 4 * 1024 * 1024;
const bufferArray: Buffer[] = [];
const bufferCount = 10;

for (let i = 0; i < bufferCount; i++) {
  const randomString = randomBytes(bufferSize / 2).toString("hex");
  bufferArray.push(Buffer.from(randomString));
}

export default class RandomReadStream extends Readable {
  private leftBytes: number;
  private bufferId: number;

  public constructor(
    public readonly length: number,
    options?: ReadableOptions
  ) {
    super(options);
    this.leftBytes = length;
    this.bufferId = 0;
  }

  public _read(size: number): void {
    if (this.leftBytes === 0) {
      this.push(null);
    } else if (this.leftBytes >= bufferSize) {
      this.leftBytes -= bufferSize;
      this.push(bufferArray[this.bufferId]);
      this.bufferId = (this.bufferId + 1) % bufferCount;
    } else {
      const leftSize = this.leftBytes;
      this.leftBytes = 0;
      this.push(Buffer.alloc(leftSize));
    }
  }
}
