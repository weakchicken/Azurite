import IGCExtentProvider from "../../common/IGCExtentProvider";
import IBlobMetadataStore, {
  BlobModel,
  BlockModel,
  ContainerModel,
  ServicePropertiesModel
} from "./IBlobMetadataStore";

export default class LokiBlobMetadataStore
  implements IBlobMetadataStore, IGCExtentProvider {
  setServiceProperties(
    serviceProperties: ServicePropertiesModel
  ): Promise<ServicePropertiesModel> {
    throw new Error("Method not implemented.");
  }
  getServiceProperties(
    account: string
  ): Promise<ServicePropertiesModel | undefined> {
    throw new Error("Method not implemented.");
  }
  listContainers(
    account: string,
    prefix?: string | undefined,
    maxResults?: number | undefined,
    marker?: number | undefined
  ): Promise<[ContainerModel[], number | undefined]> {
    throw new Error("Method not implemented.");
  }
  createContainer(container: ContainerModel): Promise<ContainerModel> {
    throw new Error("Method not implemented.");
  }
  getContainerProperties(
    account: string,
    container: string
  ): Promise<ContainerModel | undefined> {
    throw new Error("Method not implemented.");
  }
  deleteContainer(account: string, container: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setContainerMetadata(container: ContainerModel): Promise<ContainerModel> {
    throw new Error("Method not implemented.");
  }
  listBlobs(
    account?: string | undefined,
    container?: string | undefined,
    blob?: string | undefined,
    prefix?: string | undefined,
    maxResults?: number | undefined,
    marker?: number | undefined,
    includeSnapshots?: boolean | undefined
  ): Promise<[BlobModel[], number | undefined]> {
    throw new Error("Method not implemented.");
  }
  createBlob(blob: BlobModel): Promise<void> {
    throw new Error("Method not implemented.");
  }
  downloadBlob(
    account: string,
    container: string,
    blob: string,
    snapshot?: string | undefined
  ): Promise<BlobModel | undefined> {
    throw new Error("Method not implemented.");
  }
  getBlobProperties(
    account: string,
    container: string,
    blob: string,
    snapshot?: string | undefined
  ): Promise<BlobModel | undefined> {
    throw new Error("Method not implemented.");
  }
  deleteBlob(
    account: string,
    container: string,
    blob: string,
    snapshot?: string | undefined
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setBlobHTTPHeaders(blob: BlobModel): Promise<BlobModel> {
    throw new Error("Method not implemented.");
  }
  setBlobMetadata(blob: BlobModel): Promise<BlobModel> {
    throw new Error("Method not implemented.");
  }
  stageBlock(block: BlockModel, blob?: BlobModel | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }
  commitBlockList(
    blob: BlobModel,
    blockList: { blockName: string; blockCommitType: string }[]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getBlockList(
    account: string,
    container: string,
    blob: string,
    isCommitted?: boolean | undefined
  ): Promise<{
    uncommittedBlocks: import("../generated/artifacts/models").Block[];
    committedBlocks: import("../generated/artifacts/models").Block[];
  }> {
    throw new Error("Method not implemented.");
  }
  init(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  isInitialized(): boolean {
    throw new Error("Method not implemented.");
  }
  close(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  isClosed(): boolean {
    throw new Error("Method not implemented.");
  }
  iteratorAllExtents(): AsyncIterator<string[]> {
    throw new Error("Method not implemented.");
  }
}
