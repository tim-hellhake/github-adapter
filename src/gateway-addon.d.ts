/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

declare module 'gateway-addon' {
    class Property {
        constructor(device: Device, name: string, propertyDescr: {});
        public setCachedValueAndNotify(value: any): void;
    }

    class Device {
        protected '@context': string;
        protected name: string;
        protected description: string;
        protected '@type': string[];
        protected links: Link[];

        constructor(adapter: Adapter, id: string);

        protected properties: Map<String, Property>;
        public notifyPropertyChanged(property: Property): void;
    }

    interface Link {
        rel: string;
        mediaType: string;
        href: string;
    }

    class Adapter {
        constructor(addonManager: any, id: string, packageName: string);

        public handleDeviceAdded(device: Device): void;
    }
}
