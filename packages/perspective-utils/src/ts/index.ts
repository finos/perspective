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
  constructor(url: string, send: string, records: boolean) {
    this.url = url;
    this.send = send;
  }

  start(psp: any): void {
    let socket = new WebSocket(this.url);
    let to_send = this.send;
    let as_record = this.records;
    socket.onopen = function (event: any) {
      if (to_send){
        socket.send(to_send);
      }
    };

    socket.onmessage = function (event: any) {
      if (as_record){
        psp.update([event.data]);
      } else {
        psp.update(event.data);
      }
    };

  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private send:string;
  private records:boolean;
}

export
class PSPSocketIOHelper implements PSPHelper {
  constructor(url: string, channel: string, records: boolean) {
    this.url = url;
    this.channel = channel;
    this.records = records;
  }

  start(psp: any): void {
    let socket = io.connect(this.url);
    let as_record = this.records;
    socket.on(this.channel, function (msg: any) {
      if (as_record){
        psp.update([msg.msg]);
      } else {
        psp.update(msg.msg);
      }
    })
  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private channel:string;
  private records:boolean;
}

export
class PSPHttpHelper implements PSPHelper {
  constructor(url:string, field: string, records: boolean, repeat: number) {
    this.url = url;
    this.field = field;
    this.records = records;
    this.repeat = repeat;
  }


  sendAndLoad(psp: any){
    let xhr = new XMLHttpRequest();
    let field = this.field;
    let as_record = this.records;

    xhr.open('GET', this.url, true);
    xhr.onload = function () { 
        let data = JSON.parse(xhr.response);
        if (field !== ''){
          data = data[field];
        }

        if (as_record){
          psp.update([data]);
        } else {
          psp.update(data);
        }
    }
    xhr.send(null);
  }

  start(psp: any): void {
    if(this.repeat){
      setInterval( () => this.sendAndLoad(psp), this.repeat);
    } else {
      this.sendAndLoad(psp);
    }
  }

  getUrl(): string {
    return this.url;
  }

  private url:string;
  private field:string;
  private records:boolean;
  private repeat:number;
}
