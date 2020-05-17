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
  private forksProperty: Property;

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

    this.forksProperty = this.createProperty('forks', {
      type: 'integer',
      title: 'Forks',
      description: 'The number of forks',
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

    this.issuesProperty.setCachedValueAndNotify(json.open_issues);
    this.forksProperty.setCachedValueAndNotify(json.forks_count);
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
