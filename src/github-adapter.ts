/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';

import fetch from 'node-fetch';

export class Repository extends Device {
  private repo: string;
  private issuesProperty: Property;

  constructor(adapter: Adapter, repo: string) {
    super(adapter, repo.replace('/', '-'));
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this.name = `GitHub ${repo}`;
    this.description = 'GitHub repository';
    this.repo = repo;

    this.issuesProperty = this.createProperty('issues', {
      type: 'integer',
      title: 'Open Issues',
      description: 'The number of open issues',
      readOnly: true,
    });

    this.links = [
      {
        rel: 'alternate',
        mediaType: 'text/html',
        href: `https://github.com/${repo}/issues`,
      },
    ];
  }

  createProperty(name: string, description: any) {
    const property = new Property(this, name, description);
    this.properties.set(name, property);
    return property;
  }

  startPolling(interval: number) {
    this.poll();

    setInterval(() => {
      this.poll();
    }, interval * 1000);
  }

  async poll() {
    const result = await fetch(`https://api.github.com/repos/${this.repo}`);
    const json = await result.json();
    this.updateValue('Open Issues', json.open_issues);
  }

  updateValue(name: string, value: any) {
    console.log(`Set ${name} to ${value}`);
    this.issuesProperty.setCachedValue(value);
    this.notifyPropertyChanged(this.issuesProperty);
  }
}

export class GitHubAdapter extends Adapter {
  constructor(addonManager: any, manifest: any) {
    super(addonManager, GitHubAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    if (!manifest.moziot.config.repos) {
      return;
    }

    for (const name of manifest.moziot.config.repos) {
      console.log(`Creating repository for ${name}`);
      const repository = new Repository(this, name);
      this.handleDeviceAdded(repository);
      repository.startPolling(15 * 60);
    }
  }
}
