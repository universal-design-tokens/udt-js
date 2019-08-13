import TokenType from './token-type';

// Shared properties

export interface UdtNodeConstructionData {
  name?: string;
}

interface UdtNodeData extends UdtNodeConstructionData {
  type?: TokenType;
}

export interface TokenContainerData extends UdtNodeData {
  description?: string; // plain descr
}

// Tokens

export interface TokenData extends UdtNodeData {
  id?: string;
  description?: string; // referenceable descr
  value: any; // referenceable
}

export interface ColorTokenData extends TokenData {
  type?: TokenType.Color;
  value: string;
}

// Token Array

export interface TokenArrayObjectData extends TokenContainerData {
  tokens: any[];
}


export type TokenArrayData = TokenArrayObjectData | any[];


// Token Map

export interface TokenMapData extends TokenContainerData {
  [key: string]: any;
}


