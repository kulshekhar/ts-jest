import { SourceFile, Node } from 'typescript';
import Replacement from './replacement';

// see tslint: https://github.com/palantir/tslint/blob/master/src/language/rule/rule.ts

export default class TransformationManager {
  protected _replacements: Replacement[];

  constructor(protected _sourceFile: SourceFile) {
    this._replacements = [];
  }

  get sourceFile(): SourceFile {
    return this._sourceFile;
  }

  applyAndFlush(): SourceFile {
    if (this._replacements.length === 0) {
      return this._sourceFile;
    }

    const replacements = this._replacements;
    // sort
    replacements.sort(
      (a, b) => (b.end !== a.end ? b.end - a.end : b.start - a.start),
    );
    // compute new text
    const oldText = this.sourceFile.text;
    const newText = replacements.reduce((text, r) => r.apply(text), oldText);
    // apply
    this._sourceFile = this._sourceFile.update(newText, {
      newLength: newText.length,
      span: { start: 0, length: oldText.length },
    });
    // flush
    this._replacements = [];

    return this._sourceFile;
  }

  replaceNode(node: Node, text: string) {
    return this._push(
      this._replaceFromTo(node.getStart(this.sourceFile), node.getEnd(), text),
    );
  }

  replaceFromTo(start: number, end: number, text: string) {
    return this._push(new Replacement(start, end - start, text));
  }

  deleteText(start: number, length: number) {
    return this._push(new Replacement(start, length, ''));
  }

  deleteFromTo(start: number, end: number) {
    return this._push(new Replacement(start, end - start, ''));
  }

  appendText(start: number, text: string) {
    return this._push(new Replacement(start, 0, text));
  }

  protected _push(...replacements: Replacement[]): this {
    this._replacements.push(...replacements);
    return this;
  }

  protected _replaceFromTo(start: number, end: number, text: string) {
    return new Replacement(start, end - start, text);
  }
}
