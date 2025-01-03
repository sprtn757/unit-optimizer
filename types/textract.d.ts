declare module 'textract' {
  type TextractCallback = (error: Error | null, text: string) => void;

  interface TextractConfig {
    preserveLineBreaks?: boolean;
    preserveOnlyMultipleLineBreaks?: boolean;
    includeAltText?: boolean;
  }

  export function fromFileWithPath(
    filePath: string,
    callback: TextractCallback
  ): void;

  export function fromFileWithPath(
    filePath: string,
    config: TextractConfig,
    callback: TextractCallback
  ): void;
} 