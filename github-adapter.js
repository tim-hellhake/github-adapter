/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const fetch = require('node-fetch');

const {
  Adapter,
  Device,
  Property
} = require('gateway-addon');

class Repository extends Device {
  constructor(adapter, repo) {
    super(adapter, repo.replace('/', '-'));
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this['@type'] = ['MultiLevelSensor'];
    this.name = `Github ${repo}`;
    this.description = 'Github repository';
    this.repo = repo;

    this.addProperty({
      type: 'number',
      '@type': 'LevelProperty',
      title: 'open issues',
      description: 'The number of open issues',
      readOnly: true
    });
  }

  addProperty(description) {
    const property = new Property(this, description.title, description);
    this.properties.set(description.title, property);
  }

  startPolling(interval) {
    this.poll();

    this.timer = setInterval(() => {
      this.poll();
    }, interval * 1000);
  }

  async poll() {
    const result = await fetch(`https://api.github.com/repos/${this.repo}`);
    const json = await result.json();
    this.updateValue('open issues', json.open_issues);
  }

  updateValue(name, value) {
    console.log(`Set ${name} to ${value}`);
    const property = this.properties.get(name);
    property.setCachedValue(value);
    this.notifyPropertyChanged(property);
  }
}

class GithubAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, GithubAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    for (const name of manifest.moziot.config.repos) {
      console.log(`Creating repository for ${name}`);
      const repository = new Repository(this, name);
      this.handleDeviceAdded(repository);
      repository.startPolling(15 * 60);
    }
  }
}

module.exports = GithubAdapter;
