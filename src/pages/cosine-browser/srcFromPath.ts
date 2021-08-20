const _path = require("path");

const ERPNEXT_CODE_PREFIX = "erpnext/code/";
const ERPNEXT_DOCS_PREFIX = "erpnext/docs/";
const AXELOR_PREFIX = "axelor-open-suite/";
const DOLIBARR_PREFIX = "dolibarr/";
const ADEMPIERE_PREFIX = "adempiere/";
const METAFRESH_CODE_PREFIX = "metafresh/code/"
const METAFRESH_DOCS_PREFIX = "metafresh/doc/"

const ERPNEXT_CODE_ROOT = "https://github.com/frappe/erpnext/tree/develop/erpnext"
const ERPNEXT_DOCS_ROOT = "https://github.com/frappe/erpnext_documentation/tree/master/erpnext_documentation/www/docs/v13/user/manual/en"
const AXELOR_CODE_ROOT = "https://github.com/axelor/axelor-open-suite/blob/master/"
const DOLIBARR_CODE_ROOT = "https://github.com/Dolibarr/dolibarr/tree/develop/";
const ADEMPIERE_CODE_ROOT = "https://github.com/adempiere/adempiere/tree/develop/";
const METAFRESH_CODE_ROOT = "https://github.com/metasfresh/metasfresh/blob/master/";
const METAFRESH_DOCS_ROOT = "https://github.com/metasfresh/metasfresh-documentation/tree/gh-pages/";

export const srcPathFromPath = (path: string): string => {
    if(path.startsWith(ERPNEXT_CODE_PREFIX)) {
        return _path.join(ERPNEXT_CODE_ROOT, path.substr(ERPNEXT_CODE_PREFIX.length))
    } else if(path.startsWith(ERPNEXT_DOCS_PREFIX)) {
        return _path.join(ERPNEXT_DOCS_ROOT, path.substr(ERPNEXT_DOCS_PREFIX.length))
    } else if(path.startsWith(AXELOR_PREFIX)) {
        return _path.join(AXELOR_CODE_ROOT, path.substr(AXELOR_PREFIX.length))
    } else if(path.startsWith(DOLIBARR_PREFIX)) {
        return _path.join(DOLIBARR_CODE_ROOT, path.substr(DOLIBARR_PREFIX.length))
    } else if(path.startsWith(ADEMPIERE_PREFIX)) {
        return _path.join(ADEMPIERE_CODE_ROOT, path.substr(ADEMPIERE_PREFIX.length))
    } else if(path.startsWith(METAFRESH_CODE_PREFIX)) {
        return _path.join(METAFRESH_CODE_ROOT, path.substr(METAFRESH_CODE_PREFIX.length))
    } else if(path.startsWith(METAFRESH_DOCS_PREFIX)) {
        return _path.join(METAFRESH_DOCS_ROOT, path.substr(METAFRESH_DOCS_PREFIX.length))
    }

    return "???"
}

