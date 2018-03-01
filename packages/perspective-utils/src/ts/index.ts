/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as io from 'socket.io-client';

export
interface PSPHelper {
    //FIXME should enforce perspective viewer type
    start(psp: any): void;
    getUrl(): string;
}

export
class PSPWebsocketHelper implements PSPHelper {
  constructor(url:string, send:string) {
    this.url = url;
    this.send = JSON.parse(send);
  }

  start(psp: any): void {
    let socket = new WebSocket(this.url);
    socket.onopen = function (event: any) {

    }.bind(this);

    socket.onmessage = function (event: any) {
      psp.update(event.msg);
    }.bind(this);

    if (this.send){
      socket.send(this.send);
    }
  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private send:JSON;
}

export
class PSPSocketIOHelper implements PSPHelper {
  constructor(url: string, channel: string) {
    this.url = url;
    this.channel = channel;
  }

  start(psp: any): void {
    let socket = io.connect(this.url);
    socket.on(this.channel, function (msg: any) {
      psp.update([msg.msg]);
    })
  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private channel:string;
}

export
class PSPHttpHelper implements PSPHelper {
  constructor(url:string, field: string) {
    this.url = url;
    this.field = field;
  }

  start(psp: any): void {
    let xhr = new XMLHttpRequest();
    let field = this.field;
    xhr.open('GET', this.url, true);
    xhr.onload = function () { 
        let data = JSON.parse(xhr.response);
        if (field !== ''){
          data = data[field];
        }
        psp.update(data);
    }
    xhr.send(null);
  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private field:string;
}
