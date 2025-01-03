declare module 'pptx2json' {
  interface Slide {
    title?: string;
    content?: string[];
  }

  interface PptxContent {
    slides: Slide[];
  }

  class PPTX2Json {
    constructor(options?: { [key: string]: any });
    parse(buffer: Buffer): Promise<PptxContent>;
  }

  export = PPTX2Json;
} 