import * as React from "react";
import { create } from "react-test-renderer";
import { PerspectiveViewer } from "../viewer";

describe("Perspective Viewer React", () => {
  let root;

  beforeEach(() => {
    root = create(<PerspectiveViewer />).root;
  });

  it("should have one child", () => {
    const children = root.children;
    expect(children.length).toEqual(1);
  });

  it("should be a perspective viewer", () => {
    const child = root.children[0];
    expect(child.type).toEqual("perspective-viewer");
  });
});