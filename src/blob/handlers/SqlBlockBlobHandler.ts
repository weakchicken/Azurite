import BlobStorageContext from "../context/BlobStorageContext";
import NotImplementedError from "../errors/NotImplementedError";
import StorageErrorFactory from "../errors/StorageErrorFactory";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import IBlockBlobHandler from "../generated/handlers/IBlockBlobHandler";
import { parseXML } from "../generated/utils/xml";
import { BlobModel, BlockModel } from "../persistence/IBlobDataStore";
import { API_VERSION } from "../utils/constants";
import { getMD5FromStream, getMD5FromString, newEtag } from "../utils/utils";
import SqlBaseHandler from "./SqlBaseHandler";

/**
 * BlobHandler handles Azure Storage BlockBlob related requests.
 *
 * @export
 * @class SqlBlockBlobHandler
 * @extends {BaseHandler}
 * @implements {IBlockBlobHandler}
 */
export default class SqlBlockBlobHandler extends SqlBaseHandler
  implements IBlockBlobHandler {
  public async upload(
    body: NodeJS.ReadableStream,
    contentLength: number,
    options: Models.BlockBlobUploadOptionalParams,
    context: Context
  ): Promise<Models.BlockBlobUploadResponse> {
    // TODO: Check Lease status, and set to available if it's expired, see sample in BlobHandler.setMetadata()
    const blobCtx = new BlobStorageContext(context);
    const accountName = blobCtx.account!;
    const containerName = blobCtx.container!;
    const blobName = blobCtx.blob!;
    const date = context.startTime!;
    const etag = newEtag();
    options.blobHTTPHeaders = options.blobHTTPHeaders || {};
    const contentType =
      options.blobHTTPHeaders.blobContentType ||
      context.request!.getHeader("content-type") ||
      "application/octet-stream";
    const contentMD5 =
      options.blobHTTPHeaders.blobContentMD5 ||
      context.request!.getHeader("content-md5");

    const container = await this.dataStore.getContainer(
      accountName,
      containerName
    );
    if (!container) {
      throw StorageErrorFactory.getContainerNotFound(blobCtx.contextID!);
    }

    // console.log(`upload block ${blobName} starts`);
    const persistency = await this.extentStore.appendExtent(body);
    if (persistency.count !== contentLength) {
      throw StorageErrorFactory.getInvalidOperation(
        blobCtx.contextID!,
        `The size of the request body ${
          persistency.count
        } mismatches the content-length ${contentLength}.`
      );
    }
    // console.log(`upload block ${blobName} done`);

    // Calculate MD5 for validation
    const stream = await this.extentStore.readExtent(persistency);
    const calculatedContentMD5 = await getMD5FromStream(stream);
    if (contentMD5 !== undefined) {
      if (typeof contentMD5 === "string") {
        const calculatedContentMD5String = Buffer.from(
          calculatedContentMD5
        ).toString("base64");
        if (contentMD5 !== calculatedContentMD5String) {
          throw StorageErrorFactory.getInvalidOperation(
            context.contextID!,
            "Provided contentMD5 doesn't match."
          );
        }
      } else {
        if (
          contentMD5 !== undefined &&
          !Buffer.from(contentMD5).equals(calculatedContentMD5)
        ) {
          throw StorageErrorFactory.getInvalidOperation(
            context.contextID!,
            "Provided contentMD5 doesn't match."
          );
        }
      }
    }

    const blob: BlobModel = {
      deleted: false,
      metadata: options.metadata,
      accountName,
      containerName,
      name: blobName,
      properties: {
        creationTime: date,
        lastModified: date,
        etag,
        contentLength,
        contentType,
        contentEncoding: options.blobHTTPHeaders.blobContentEncoding,
        contentLanguage: options.blobHTTPHeaders.blobContentLanguage,
        contentMD5: calculatedContentMD5,
        contentDisposition: options.blobHTTPHeaders.blobContentDisposition,
        cacheControl: options.blobHTTPHeaders.blobCacheControl,
        blobType: Models.BlobType.BlockBlob,
        leaseStatus: Models.LeaseStatusType.Unlocked,
        leaseState: Models.LeaseStateType.Available,
        serverEncrypted: true,
        accessTier: Models.AccessTier.Hot,
        accessTierInferred: true
      },
      snapshot: "",
      isCommitted: true,
      persistency
    };

    // TODO: Need a lock for multi keys including containerName and blobName
    await this.dataStore.updateBlob(blob);

    const response: Models.BlockBlobUploadResponse = {
      statusCode: 201,
      eTag: etag,
      lastModified: date,
      contentMD5: blob.properties.contentMD5,
      requestId: blobCtx.contextID,
      version: API_VERSION,
      date,
      isServerEncrypted: true
    };

    return response;
  }

  public async stageBlock(
    blockId: string,
    contentLength: number,
    body: NodeJS.ReadableStream,
    options: Models.BlockBlobStageBlockOptionalParams,
    context: Context
  ): Promise<Models.BlockBlobStageBlockResponse> {
    // TODO: Check Lease status, and set to available if it's expired, see sample in BlobHandler.setMetadata()
    const blobCtx = new BlobStorageContext(context);
    const accountName = blobCtx.account!;
    const containerName = blobCtx.container!;
    const blobName = blobCtx.blob!;
    const date = blobCtx.startTime!;

    // console.log(`stageBlock ${blockId} starts`);
    const persistency = await this.extentStore.appendExtent(body); // this.dataStore.writePayload(body);
    if (persistency.count !== contentLength) {
      // TODO: Confirm error code
      throw StorageErrorFactory.getInvalidOperation(
        blobCtx.contextID!,
        `The size of the request body ${
          persistency.count
        } mismatches the content-length ${contentLength}.`
      );
    }

    // console.log(`stageBlock ${blockId} ends`);
    const block: BlockModel = {
      accountName,
      containerName,
      blobName,
      isCommitted: false,
      name: blockId,
      size: contentLength,
      persistency
    };

    await this.sqlDataStore.stageBlock(block);

    const response: Models.BlockBlobStageBlockResponse = {
      statusCode: 201,
      contentMD5: undefined, // TODO: Block content MD5
      requestId: blobCtx.contextID,
      version: API_VERSION,
      date,
      isServerEncrypted: true
    };

    return response;
  }

  public async stageBlockFromURL(
    blockId: string,
    contentLength: number,
    sourceUrl: string,
    options: Models.BlockBlobStageBlockFromURLOptionalParams,
    context: Context
  ): Promise<Models.BlockBlobStageBlockFromURLResponse> {
    throw new NotImplementedError(context.contextID);
  }

  public async commitBlockList(
    blocks: Models.BlockLookupList,
    options: Models.BlockBlobCommitBlockListOptionalParams,
    context: Context
  ): Promise<Models.BlockBlobCommitBlockListResponse> {
    const blobCtx = new BlobStorageContext(context);
    const accountName = blobCtx.account!;
    const containerName = blobCtx.container!;
    const blobName = blobCtx.blob!;
    const request = blobCtx.request!;

    options.blobHTTPHeaders = options.blobHTTPHeaders || {};

    // Here we leveraged generated code utils to parser xml
    // Re-parsing request body to get destination blocks
    // We don't leverage serialized blocks parameter because it doesn't include sequence
    const rawBody = request.getBody();
    const badRequestError = StorageErrorFactory.getInvalidOperation(
      blobCtx.contextID!
    );
    if (rawBody === undefined) {
      throw badRequestError;
    }
    const parsed = await parseXML(rawBody, true);

    // Validate selected block list
    const commitBlockList = [];

    // $$ is the built-in field of xml2js parsing results when enabling explicitChildrenWithOrder
    // TODO: Should make these fields explicit for parseXML method
    // TODO: What happens when committedBlocks and uncommittedBlocks contains same block ID?
    if (parsed !== undefined && parsed.$$ instanceof Array) {
      for (const block of parsed.$$) {
        const blockID: string | undefined = block._;
        const blockCommitType: string | undefined = block["#name"];

        if (blockID === undefined || blockCommitType === undefined) {
          throw badRequestError;
        }
        commitBlockList.push({
          blockName: blockID,
          blockCommitType
        });
      }
    }

    const blob: BlobModel = {
      accountName,
      containerName,
      name: blobName,
      snapshot: "",
      properties: {
        lastModified: new Date(),
        etag: newEtag()
      },
      isCommitted: true
    };

    await this.sqlDataStore.commitBlockList(blob, commitBlockList);

    const contentMD5 = await getMD5FromString(rawBody);

    const response: Models.BlockBlobCommitBlockListResponse = {
      statusCode: 201,
      eTag: newEtag(),
      lastModified: blobCtx.startTime,
      contentMD5,
      requestId: blobCtx.contextID,
      version: API_VERSION,
      date: blobCtx.startTime,
      isServerEncrypted: true
    };
    return response;
  }

  public async getBlockList(
    options: Models.BlockBlobGetBlockListOptionalParams,
    context: Context
  ): Promise<Models.BlockBlobGetBlockListResponse> {
    const blobCtx = new BlobStorageContext(context);
    const accountName = blobCtx.account!;
    const containerName = blobCtx.container!;
    const blobName = blobCtx.blob!;
    const date = blobCtx.startTime!;

    const container = await this.dataStore.getContainer(
      accountName,
      containerName
    );
    if (!container) {
      throw StorageErrorFactory.getContainerNotFound(blobCtx.contextID!);
    }

    const blob = await this.dataStore.getBlob(
      accountName,
      containerName,
      blobName
    );
    if (!blob) {
      throw StorageErrorFactory.getBlobNotFound(blobCtx.contextID!);
    }

    const blockList = await this.dataStore.listBlocks(
      accountName,
      containerName,
      blobName,
      false
    );
    const response: Models.BlockBlobGetBlockListResponse = {
      statusCode: 200,
      lastModified: blob.properties.lastModified,
      eTag: blob.properties.etag,
      contentType: blob.properties.contentType,
      blobContentLength: blob.properties.contentLength,
      requestId: blobCtx.contextID,
      version: API_VERSION,
      date,
      committedBlocks: [],
      uncommittedBlocks: []
    };

    response.uncommittedBlocks = blockList;
    response.committedBlocks = blob.committedBlocksInOrder;

    return response;
  }
}
