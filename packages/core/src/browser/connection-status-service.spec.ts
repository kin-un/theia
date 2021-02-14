/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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

import { enableJSDOM } from '../browser/test/jsdom';

let disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from './frontend-application-config-provider';
import { ApplicationProps } from '@theia/application-package/lib/application-props';
FrontendApplicationConfigProvider.set({
    ...ApplicationProps.DEFAULT.frontend.config
});

import { expect } from 'chai';
import * as sinon from 'sinon';
import { ConnectionStatus } from './connection-status-service';
import { MockConnectionStatusService, MockFrontendConnectionStatusService } from './test/mock-connection-status-service';

disableJSDOM();

describe('connection-status', function (): void {

    let connectionStatusService: MockConnectionStatusService;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        connectionStatusService = new MockConnectionStatusService();
    });

    afterEach(() => {
        if (connectionStatusService !== undefined) {
            connectionStatusService.dispose();
        }
    });

    it('should go from online to offline if the connection is down', async () => {
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        connectionStatusService.alive = false;
        await pause();

        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
    });

    it('should go from offline to online if the connection is re-established', async () => {
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        connectionStatusService.alive = false;
        await pause();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);

        connectionStatusService.alive = true;
        await pause();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
    });

});

describe('frontend-connection-status', function (): void {
    let connectionStatusService: MockFrontendConnectionStatusService;
    let pingMock: sinon.SinonStub;

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        connectionStatusService = new MockFrontendConnectionStatusService();
        pingMock = sinon.stub(connectionStatusService.ping, 'ping');
    });

    afterEach(() => {
        if (connectionStatusService !== undefined) {
            connectionStatusService.dispose();
        }

        pingMock.restore();
    });

    it('should switch status to offline on websocket close', () => {
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        connectionStatusService.connectionProvider.socketClosed();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
    });

    it('should switch status to online on websocket established', () => {
        connectionStatusService.connectionProvider.socketClosed();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
        connectionStatusService.connectionProvider.socketOpened();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
    });

    it('should switch status to online on any websocket activity',  () => {
        connectionStatusService.connectionProvider.socketClosed();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
    });

    it('should perform ping request after socket activity', async () => {
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT + 1);
        sinon.assert.calledOnce(pingMock);
    });

    it('should perform ping request after socket activity with twice delay', async () => {
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT * 2.5);
        sinon.assert.calledTwice(pingMock);
    });

    it('should not perform ping request before desired timeout', async () => {
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT - 1);
        sinon.assert.notCalled(pingMock);
    });

    it('should switch to offline mode if ping request was rejected', async () => {
        pingMock.onCall(0).throws('failed to make a ping request');
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT + 1);
        sinon.assert.calledOnce(pingMock);
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
    });

    it('should not perform ping request after opening and immediately closed socket', async () => {
        connectionStatusService.connectionProvider.socketActivity();
        connectionStatusService.connectionProvider.socketClosed();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.OFFLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT + 1);
        sinon.assert.notCalled(pingMock);
    });

    it('should should perform one ping request after several events that comes with delay', async () => {
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT * 0.2);
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT * 0.2);
        connectionStatusService.connectionProvider.socketActivity();
        expect(connectionStatusService.currentStatus).to.be.equal(ConnectionStatus.ONLINE);
        await pause(connectionStatusService.MOCK_PING_TIMEOUT + 1);
        sinon.assert.calledOnce(pingMock);
    });
});

function pause(time: number = 1): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, time));
}
