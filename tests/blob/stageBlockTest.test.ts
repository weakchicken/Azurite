import {
  Aborter,
  BlobURL,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  SharedKeyCredential,
  StorageURL,
  uploadStreamToBlockBlob
} from "@azure/storage-blob";

import { configLogger } from "../../src/common/Logger";
import {
  EMULATOR_ACCOUNT_KEY,
  EMULATOR_ACCOUNT_NAME,
  getUniqueName
} from "../testutils";

// import assert = require("assert");
import RandomReadStream from "../RandomReadStream";
// Disable debugging log by passing false
configLogger(false);

console.log("start");

// tslint:disable:no-empty
describe("StageBlockTest", () => {
  const host = "127.0.0.1";
  const port = 10001;
  console.log(`pid:${process.pid}, port${port}`);

  // TODO: Create serviceURL factory as tests utils
  const baseURL = `http://${host}:${port}/devstoreaccount1`;
  const serviceURL = new ServiceURL(
    baseURL,
    StorageURL.newPipeline(
      new SharedKeyCredential(EMULATOR_ACCOUNT_NAME, EMULATOR_ACCOUNT_KEY),
      {
        retryOptions: { maxTries: 1 }
      }
    )
  );
  let containerName = getUniqueName("container");
  let containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
  let blobName = getUniqueName("blob");
  let blobURL = BlobURL.fromContainerURL(containerURL, blobName);
  let blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);

  beforeEach(async () => {
    containerName = getUniqueName("container");
    containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    blobName = getUniqueName("blob");
    blobURL = BlobURL.fromContainerURL(containerURL, blobName);
    blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
  });

  afterEach(async () => {
    await containerURL.delete(Aborter.none);
  });

  before(async () => {});

  after(async () => {});

  it.only("Upload a large file of a random readstream by stageblock.", async () => {
    console.log("Get random read stream");
    const rs = new RandomReadStream(100 * 1024 * 1024 * 1024);
    console.log("Stage");
    await uploadStreamToBlockBlob(
      Aborter.none,
      rs,
      blockBlobURL,
      4 * 1024 * 1024,
      5
    );
  });
});
