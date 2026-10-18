declare module 'mammoth' {
  export interface MammothMessage {
    type: 'warning' | 'error';
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: unknown;
    path?: string;
    styleMap?: string | string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    convertImage?: (element: any) => Promise<{ src: string }>;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: MammothOptions
  ): Promise<MammothResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer }
  ): Promise<{ value: string; messages: MammothMessage[] }>;

  export const images: {
    dataUri: (image: {
      read: (encoding?: string) => Promise<string | ArrayBuffer>;
      contentType: string;
    }) => Promise<{ src: string }>;
  };
}
