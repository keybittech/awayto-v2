export interface FileStoreStrategy {
  shouldDelete: boolean;
  loaded(): boolean;
  post(file: File): Promise<string>;
  put(file: File): Promise<string>;
  get(id: string): Promise<string>;
  delete(id: string): Promise<string>;
}

export enum FileStoreStrategies {
  FILE_SYSTEM = "fs",
  IPFS = "ipfs",
  AWS_S3 = "aws"
}

export class FileStoreContext {

  private strategy: FileStoreStrategy;

  shouldDelete: boolean;

  constructor(strategy: FileStoreStrategy) {
    this.strategy = strategy;
    this.shouldDelete = this.strategy.shouldDelete;
  }

  public loaded(): boolean {
    return this.strategy.loaded();
  }

  public async post(file: File): Promise<string> {
    return await this.strategy.post(file);
  }

  public async put(file: File): Promise<string> {
    return await this.strategy.put(file);
  }

  public async get(id: string): Promise<string> {
    return await this.strategy.get(id);
  }

  public async delete(id: string): Promise<string> {
    return await this.strategy.delete(id);
  }
}

export class FileSystemFileStoreStrategy implements FileStoreStrategy {

  ready = true;
  shouldDelete = true;

  public loaded(): boolean {
    return this.ready;
  }
  
  public async post(): Promise<string> {
    await new Promise(() => { return 'stub' });
    return '';
  }

  public async put(): Promise<string> {
    await new Promise(() => { return 'stub' });
    return '';
  }

  public async get(): Promise<string> {
    await new Promise(() => { return 'stub' });
    return '';
  }

  public async delete(): Promise<string> {
    await new Promise(() => { return 'stub' });
    return '';
  }
}