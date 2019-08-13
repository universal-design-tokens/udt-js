import { readFile } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
import TokenArray from './base/token-array';

const asyncReadFile = promisify(readFile);


export interface FileData {
  tokens: any[];
  description?: string;
};

const emptyFileData: FileData = {
  tokens: []
};

export default class UdtFile extends TokenArray {

  constructor(
    filename: string,
    data: FileData = emptyFileData,
  ) {
    super({
      name: filename,
      ...data,
    });
  }

  protected _isFile(): true {
    return true;
  }

  public getPath(): string[] {
    return [];
  }

  public checkReferences() {
    for(const token of this.traverseTokens()) {
      token.checkReferences();
    }
  }

  public static parse(filename: string, udtJsonString: string): UdtFile {
    const file = new UdtFile(filename, JSON.parse(udtJsonString));
    file.checkReferences();
    return file;
  }

  public static async load(filepath: string): Promise<UdtFile> {
    const udtJsonString = await asyncReadFile(filepath, 'utf8');
    return UdtFile.parse(basename(filepath), udtJsonString);
  }
}
