// tslint:disable-next-line:no-reference
///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk'

export class MyQueryCtrl extends QueryCtrl {
  static templateUrl = "query.html"
}
