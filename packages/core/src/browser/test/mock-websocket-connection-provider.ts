/********************************************************************************
 * Copyright (C) 2021 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import {WebSocketConnectionProvider} from '../../browser/messaging/ws-connection-provider';
import {Emitter, Event} from '../../common/event';

export class MockWebsocketConnectionProvider extends WebSocketConnectionProvider {
    protected readonly onSocketOpenedEmitter: Emitter<void> = new Emitter();
    public onSocketOpened: Event<void> = this.onSocketOpenedEmitter.event;

    protected readonly onSocketClosedEmitter: Emitter<void> = new Emitter();
    public onSocketClosed: Event<void> = this.onSocketClosedEmitter.event;

    protected readonly onIncomingMessageActivityEmitter: Emitter<void> = new Emitter();
    public onIncomingMessageActivity: Event<void> = this.onIncomingMessageActivityEmitter.event;

    // @ts-ignore
    constructor() {
        // not need to connect to webscoket, we need to fire events only
    }
    socketOpened(): void {
        this.onSocketOpenedEmitter.fire(undefined);
    }
    socketClosed(): void {
        this.onSocketClosedEmitter.fire(undefined);
    }
    socketActivity(): void {
        this.onIncomingMessageActivityEmitter.fire(undefined);
    }
}
