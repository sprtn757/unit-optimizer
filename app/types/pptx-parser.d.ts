declare module 'pptx-parser' {
  interface Shape {
    text?: string;
  }

  interface Slide {
    shapes: Shape[];
    notes?: string;
  }

  interface Presentation {
    slides: Slide[];
  }

  export class PptxParser {
    parse(buffer: Buffer): Promise<Presentation>;
  }
} 