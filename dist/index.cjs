'use strict';

const node_http = require('node:http');
const node_https = require('node:https');
const node_util = require('node:util');
const getPortPlease = require('get-port-please');
const addShutdown = require('http-shutdown');
const consola = require('consola');
const defu = require('defu');
const utils = require('consola/utils');
const uqr = require('uqr');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const node_path = require('node:path');
const pathe = require('pathe');
const stdEnv = require('std-env');
const forge = require('node-forge');
const promises = require('node:fs/promises');
const mlly = require('mlly');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const addShutdown__default = /*#__PURE__*/_interopDefaultCompat(addShutdown);
const consola__default = /*#__PURE__*/_interopDefaultCompat(consola);
const childProcess__default = /*#__PURE__*/_interopDefaultCompat(childProcess);
const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const os__default = /*#__PURE__*/_interopDefaultCompat(os);
const forge__default = /*#__PURE__*/_interopDefaultCompat(forge);

let isDockerCached;
function isDocker() {
  if (isDockerCached === void 0) {
    isDockerCached = _hasDockerEnvironment() || _hasDockerCGroup();
  }
  return isDockerCached;
}
function _hasDockerEnvironment() {
  try {
    fs.statSync("/.dockerenv");
    return true;
  } catch {
    return false;
  }
}
function _hasDockerCGroup() {
  try {
    return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
  } catch {
    return false;
  }
}

let isWSLCached;
function isWsl() {
  if (isWSLCached === void 0) {
    isWSLCached = _isWsl();
  }
  return isWSLCached;
}
function _isWsl() {
  if (process.platform !== "linux") {
    return false;
  }
  if (os__default.release().toLowerCase().includes("microsoft")) {
    if (isDocker()) {
      return false;
    }
    return true;
  }
  try {
    return fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isDocker() : false;
  } catch {
    return false;
  }
}
const defaultMountPoint = "/mnt/";
let _wslMountpoint;
function getWslDrivesMountPoint() {
  if (_wslMountpoint) {
    return _wslMountpoint;
  }
  const configFilePath = "/etc/wsl.conf";
  let isConfigFileExists = false;
  try {
    fs.accessSync(configFilePath, fs.constants.F_OK);
    isConfigFileExists = true;
  } catch {
  }
  if (!isConfigFileExists) {
    return defaultMountPoint;
  }
  const configContent = fs.readFileSync(configFilePath, { encoding: "utf8" });
  const configMountPoint = /(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(
    configContent
  );
  if (!configMountPoint || !configMountPoint.groups) {
    return defaultMountPoint;
  }
  _wslMountpoint = configMountPoint.groups.mountPoint.trim();
  _wslMountpoint = _wslMountpoint.endsWith("/") ? _wslMountpoint : `${_wslMountpoint}/`;
  return _wslMountpoint;
}

async function open(target, options = {}) {
  let command;
  const cliArguments = [];
  const childProcessOptions = {};
  if (process.platform === "darwin") {
    command = "open";
    if (options.wait) {
      cliArguments.push("--wait-apps");
    }
    if (options.background) {
      cliArguments.push("--background");
    }
    if (options.newInstance) {
      cliArguments.push("--new");
    }
  } else if (process.platform === "win32" || isWsl() && !isDocker()) {
    command = isWsl() ? `${getWslDrivesMountPoint()}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` : `${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;
    cliArguments.push(
      "-NoProfile",
      "-NonInteractive",
      "\u2013ExecutionPolicy",
      "Bypass",
      "-EncodedCommand"
    );
    if (!isWsl()) {
      childProcessOptions.windowsVerbatimArguments = true;
    }
    const encodedArguments = ["Start"];
    if (options.wait) {
      encodedArguments.push("-Wait");
    }
    encodedArguments.push(target);
    target = Buffer.from(encodedArguments.join(" "), "utf16le").toString(
      "base64"
    );
  } else {
    command = "xdg-open";
    const useSystemXdgOpen = process.versions.electron || process.platform === "android";
    if (!useSystemXdgOpen) {
      command = node_path.join(os__default.tmpdir(), "xdg-open");
      if (!fs__default.existsSync(command)) {
        try {
          fs__default.writeFileSync(
            node_path.join(os__default.tmpdir(), "xdg-open"),
            await import('./chunks/xdg-open.cjs').then((r) => r.xdgOpenScript()),
            "utf8"
          );
          fs__default.chmodSync(
            command,
            493
            /* rwx r-x r-x */
          );
        } catch {
          command = "xdg-open";
        }
      }
    }
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
      childProcessOptions.detached = true;
    }
  }
  cliArguments.push(target);
  const subprocess = childProcess__default.spawn(
    command,
    cliArguments,
    childProcessOptions
  );
  if (options.wait) {
    return new Promise((resolve, reject) => {
      subprocess.once("error", reject);
      subprocess.once("close", (exitCode) => {
        if (options.allowNonzeroExitCode && exitCode > 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }
        resolve(subprocess);
      });
    });
  }
  subprocess.unref();
  return subprocess;
}

function getNetworkInterfaces(includeIPV6) {
  const addrs = /* @__PURE__ */ new Set();
  for (const details of Object.values(os.networkInterfaces())) {
    if (details) {
      for (const d of details) {
        if (!d.internal && !(d.mac === "00:00:00:00:00:00") && !d.address.startsWith("fe80::") && !(!includeIPV6 && (d.family === "IPv6" || +d.family === 6))) {
          addrs.add(formatAddress(d));
        }
      }
    }
  }
  return [...addrs].sort();
}
function formatAddress(addr) {
  return addr.family === "IPv6" || addr.family === 6 ? `[${addr.address}]` : addr.address;
}
function formatURL(url) {
  return utils.colors.cyan(
    utils.colors.underline(
      decodeURI(url).replace(/:(\d+)\//g, `:${utils.colors.bold("$1")}/`)
    )
  );
}
const _localHosts = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "::1"]);
function isLocalhost(hostname) {
  return hostname === void 0 ? false : _localHosts.has(hostname);
}
const _anyHosts = /* @__PURE__ */ new Set(["", "0.0.0.0", "::"]);
function isAnyhost(hostname) {
  return hostname === void 0 ? false : _anyHosts.has(hostname);
}
function generateURL(hostname, listhenOptions, baseURL) {
  const proto = listhenOptions.https ? "https://" : "http://";
  let port = listhenOptions.port || "";
  if (port === 80 && proto === "http://" || port === 443 && proto === "https://") {
    port = "";
  }
  if (hostname[0] !== "[" && hostname.includes(":")) {
    hostname = `[${hostname}]`;
  }
  return proto + hostname + ":" + port + (baseURL || listhenOptions.baseURL || "");
}
function getDefaultHost(preferPublic) {
  if (isDocker() || isWsl()) {
    return "";
  }
  return preferPublic ? "" : "localhost";
}
function getSocketPath(name) {
  const _name = typeof name === "string" && name.length > 0 ? name : "listhen";
  if (os.platform() === "win32") {
    if (_name.startsWith("\\\\?\\pipe\\")) {
      return _name;
    }
    return `\\\\?\\pipe\\${_name}`;
  }
  return pathe.isAbsolute(_name) ? _name : pathe.join(os.tmpdir(), `${_name}.socket`);
}
function getPublicURL(listhenOptions, baseURL) {
  if (listhenOptions.publicURL) {
    return listhenOptions.publicURL;
  }
  if (stdEnv.provider === "stackblitz") {
    const stackblitzURL = detectStackblitzURL(listhenOptions._entry);
    if (stackblitzURL) {
      return stackblitzURL;
    }
  }
  if (listhenOptions.hostname && !isLocalhost(listhenOptions.hostname) && !isAnyhost(listhenOptions.hostname)) {
    return generateURL(listhenOptions.hostname, listhenOptions, baseURL);
  }
}
function detectStackblitzURL(entry) {
  try {
    const cwd = process.env.PWD || "";
    if (cwd.startsWith("/home/projects")) {
      const projectId = cwd.split("/")[3];
      const relativeEntry = entry && pathe.relative(process.cwd(), entry).replace(/^\.\//, "");
      const query = relativeEntry ? `?file=${relativeEntry}` : "";
      return `https://stackblitz.com/edit/${projectId}${query}`;
    }
    if (cwd.startsWith("/home")) {
      const githubRepo = cwd.split("/").slice(2).join("/");
      return `https://stackblitz.com/edit/~/github.com/${githubRepo}`;
    }
  } catch (error) {
    console.error(error);
  }
}
const HOSTNAME_RE = /^(?!-)[\d.:A-Za-z-]{1,63}(?<!-)$/;
function validateHostname(hostname, _public) {
  if (hostname && !HOSTNAME_RE.test(hostname)) {
    const fallbackHost = _public ? "" : "localhost";
    consola.consola.warn(
      `[listhen] Invalid hostname \`${hostname}\`. Using \`${fallbackHost}\` as fallback.`
    );
    return fallbackHost;
  }
  return hostname;
}

const word = '[a-fA-F\\d:]';

const boundry = options => options && options.includeBoundaries
	? `(?:(?<=\\s|^)(?=${word})|(?<=${word})(?=\\s|$))`
	: '';

const v4 = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}';

const v6segment = '[a-fA-F\\d]{1,4}';

const v6 = `
(?:
(?:${v6segment}:){7}(?:${v6segment}|:)|                                    // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6segment}:){6}(?:${v4}|:${v6segment}|:)|                             // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6segment}:){5}(?::${v4}|(?::${v6segment}){1,2}|:)|                   // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6segment}:){4}(?:(?::${v6segment}){0,1}:${v4}|(?::${v6segment}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6segment}:){3}(?:(?::${v6segment}){0,2}:${v4}|(?::${v6segment}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6segment}:){2}(?:(?::${v6segment}){0,3}:${v4}|(?::${v6segment}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6segment}:){1}(?:(?::${v6segment}){0,4}:${v4}|(?::${v6segment}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::(?:(?::${v6segment}){0,5}:${v4}|(?::${v6segment}){1,7}|:))             // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(?:%[0-9a-zA-Z]{1,})?                                             // %eth0            %1
`.replace(/\s*\/\/.*$/gm, '').replace(/\n/g, '').trim();

// Pre-compile only the exact regexes because adding a global flag make regexes stateful
const v46Exact = new RegExp(`(?:^${v4}$)|(?:^${v6}$)`);
const v4exact = new RegExp(`^${v4}$`);
const v6exact = new RegExp(`^${v6}$`);

const ipRegex = options => options && options.exact
	? v46Exact
	: new RegExp(`(?:${boundry(options)}${v4}${boundry(options)})|(?:${boundry(options)}${v6}${boundry(options)})`, 'g');

ipRegex.v4 = options => options && options.exact ? v4exact : new RegExp(`${boundry(options)}${v4}${boundry(options)}`, 'g');
ipRegex.v6 = options => options && options.exact ? v6exact : new RegExp(`${boundry(options)}${v6}${boundry(options)}`, 'g');

async function resolveCertificate(options) {
  let https;
  if (typeof options === "object" && options.key && options.cert) {
    https = await resolveCert(options);
    if (options.passphrase) {
      https.passphrase = options.passphrase;
    }
  } else if (typeof options === "object" && options.pfx) {
    const pfx = await resolvePfx(options);
    if (!pfx.safeContents || pfx.safeContents.length < 2 || pfx.safeContents[0].safeBags.length === 0 || pfx.safeContents[1].safeBags.length === 0) {
      throw new Error("keystore not containing a cert AND a key");
    }
    const _cert = pfx.safeContents[0].safeBags[0].cert;
    const _key = pfx.safeContents[1].safeBags[0].key;
    https = {
      key: forge__default.pki.privateKeyToPem(_key),
      cert: forge__default.pki.certificateToPem(_cert)
    };
  } else {
    const { cert } = await generateCertificates(options);
    https = cert;
  }
  return https;
}
async function generateCertificates(options) {
  const defaults = {
    commonName: "localhost",
    countryCode: "US",
    state: "Michigan",
    locality: "Berkley",
    organization: "Testing Corp",
    organizationalUnit: "IT department",
    domains: ["localhost", "127.0.0.1", "::1"],
    validityDays: 1,
    bits: 2048
  };
  const caOptions = defu.defu(options, defaults);
  caOptions.passphrase = options.signingKeyPassphrase;
  const ca = await generateCACert(caOptions);
  const domains = Array.isArray(options.domains) ? options.domains : ["localhost", "127.0.0.1", "::1"];
  const certOptions = defu.defu(options, defaults);
  const cert = await generateTLSCert({
    ...certOptions,
    signingKeyCert: ca.cert,
    signingKey: ca.key,
    domains
  });
  return { ca, cert };
}
async function resolveCert(options) {
  if (options && options.key && options.cert) {
    const isInline = (s = "") => s.startsWith("--");
    const r = (s) => isInline(s) ? s : fs.promises.readFile(s, "utf8");
    return {
      key: await r(options.key),
      cert: await r(options.cert)
    };
  }
  throw new Error("Certificate or Private Key not present");
}
async function resolvePfx(options) {
  if (options && options.pfx) {
    const pfx = await fs.promises.readFile(options.pfx, "binary");
    const p12Asn1 = forge__default.asn1.fromDer(pfx);
    if (options.passphrase) {
      return forge__default.pkcs12.pkcs12FromAsn1(p12Asn1, options.passphrase);
    }
    return forge__default.pkcs12.pkcs12FromAsn1(p12Asn1, "");
  }
  throw new Error("Error resolving the pfx store");
}
function createAttributes(options) {
  return [
    options.commonName && { name: "commonName", value: options.commonName },
    options.countryCode && { name: "countryName", value: options.countryCode },
    options.state && { name: "stateOrProvinceName", value: options.state },
    options.locality && { name: "localityName", value: options.locality },
    options.organization && {
      name: "organizationName",
      value: options.organization
    },
    options.organizationalUnit && {
      name: "organizationalUnitName",
      value: options.organizationalUnit
    },
    options.emailAddress && {
      name: "emailAddress",
      value: options.emailAddress
    }
  ].filter(Boolean);
}
function createCertificateInfo(options) {
  if (!options.domains || options.domains && options.domains.length === 0) {
    options.domains = ["localhost.local"];
  }
  options.commonName = options.commonName || options.domains[0];
  const attributes = createAttributes(options);
  const extensions = [
    { name: "basicConstraints", cA: false, critical: true },
    {
      name: "keyUsage",
      digitalSignature: true,
      keyEncipherment: true,
      critical: true
    },
    { name: "extKeyUsage", serverAuth: true, clientAuth: true },
    {
      name: "subjectAltName",
      altNames: options.domains.map((domain) => {
        const types = { domain: 2, ip: 7 };
        const isIp = ipRegex({ exact: true }).test(domain);
        if (isIp) {
          return { type: types.ip, ip: domain };
        }
        return { type: types.domain, value: domain };
      })
    }
  ];
  return { attributes, extensions };
}
function createCaInfo(options) {
  const attributes = createAttributes(options);
  const extensions = [
    { name: "basicConstraints", cA: true, critical: true },
    { name: "keyUsage", keyCertSign: true, critical: true }
  ];
  return { attributes, extensions };
}
async function generateTLSCert(options) {
  const { attributes, extensions } = createCertificateInfo(options);
  const ca = forge__default.pki.certificateFromPem(options.signingKeyCert);
  return await generateCert({
    bits: options.bits,
    subject: attributes,
    issuer: ca.subject.attributes,
    extensions,
    validityDays: options.validityDays || 1,
    signingKey: options.signingKey,
    signingKeyPassphrase: options.signingKeyPassphrase,
    passphrase: options.passphrase
  });
}
async function generateCACert(options = {}) {
  const { attributes, extensions } = createCaInfo(options);
  return await generateCert({
    ...options,
    bits: options.bits || 2048,
    subject: attributes,
    issuer: attributes,
    extensions,
    validityDays: options.validityDays || 1
  });
}
function signCertificate(options, cert) {
  if (options.signingKey) {
    if (isValidPassphrase(options.signingKeyPassphrase)) {
      const encryptedPrivateKey = forge__default.pki.encryptedPrivateKeyFromPem(
        options.signingKey
      );
      const decryptedPrivateKey = forge__default.pki.decryptPrivateKeyInfo(
        encryptedPrivateKey,
        options.signingKeyPassphrase
      );
      cert.sign(
        forge__default.pki.privateKeyFromAsn1(decryptedPrivateKey),
        forge__default.md.sha256.create()
      );
    } else {
      cert.sign(
        forge__default.pki.privateKeyFromPem(options.signingKey),
        forge__default.md.sha256.create()
      );
    }
  } else {
    cert.sign(cert.privateKey, forge__default.md.sha256.create());
  }
}
function createCertificateFromKeyPair(keyPair, options) {
  const serial = Math.floor(Math.random() * 95e3 + 5e4).toString();
  const cert = forge__default.pki.createCertificate();
  cert.publicKey = keyPair.publicKey;
  cert.privateKey = keyPair.privateKey;
  cert.serialNumber = Buffer.from(serial).toString("hex");
  cert.validity.notBefore = /* @__PURE__ */ new Date();
  cert.validity.notAfter = /* @__PURE__ */ new Date();
  cert.validity.notAfter.setDate(
    cert.validity.notAfter.getDate() + options.validityDays
  );
  cert.setSubject(options.subject);
  cert.setIssuer(options.issuer);
  cert.setExtensions(options.extensions);
  return cert;
}
async function generateKeyPair(bits = 2048) {
  const _generateKeyPair = node_util.promisify(
    forge__default.pki.rsa.generateKeyPair.bind(forge__default.pki.rsa)
  );
  return await _generateKeyPair({
    bits,
    workers: os__default.availableParallelism ? os__default.availableParallelism() : os__default.cpus().length
  });
}
function isValidPassphrase(passphrase) {
  return typeof passphrase === "string" && passphrase.length < 2e3;
}
async function generateCert(options) {
  const keyPair = await generateKeyPair(options.bits);
  const cert = createCertificateFromKeyPair(keyPair, options);
  if (isValidPassphrase(options.passphrase)) {
    const asn1PrivateKey = forge__default.pki.privateKeyToAsn1(keyPair.privateKey);
    const privateKeyInfo = forge__default.pki.wrapRsaPrivateKey(asn1PrivateKey);
    const encryptedPrivateKeyInfo = forge__default.pki.encryptPrivateKeyInfo(
      privateKeyInfo,
      options.passphrase,
      {
        algorithm: "aes256"
      }
    );
    signCertificate(
      {
        signingKey: options.signingKey,
        signingKeyPassphrase: options.signingKeyPassphrase
      },
      cert
    );
    return {
      key: forge__default.pki.encryptedPrivateKeyToPem(encryptedPrivateKeyInfo),
      cert: forge__default.pki.certificateToPem(cert),
      passphrase: options.passphrase
    };
  } else {
    signCertificate(
      {
        signingKey: options.signingKey,
        signingKeyPassphrase: options.signingKeyPassphrase
      },
      cert
    );
    return {
      key: forge__default.pki.privateKeyToPem(keyPair.privateKey),
      cert: forge__default.pki.certificateToPem(cert)
    };
  }
}

async function listen(handle, _options = {}) {
  const _isProd = _options.isProd ?? process.env.NODE_ENV === "production";
  const _isTest = _options.isTest ?? process.env.NODE_ENV === "test";
  const _hostname = _options.hostname ?? process.env.HOST;
  const _public = _options.public ?? (isLocalhost(_hostname) ? false : void 0) ?? (isAnyhost(_hostname) ? true : void 0) ?? (process.argv.includes("--host") ? true : void 0) ?? _isProd;
  const listhenOptions = defu.defu(_options, {
    name: "",
    https: false,
    port: process.env.PORT || 3e3,
    hostname: _hostname ?? getDefaultHost(_public),
    showURL: true,
    baseURL: "/",
    open: false,
    clipboard: false,
    isTest: _isTest,
    isProd: _isProd,
    public: _public,
    socket: false,
    autoClose: true
  });
  listhenOptions.hostname = validateHostname(
    listhenOptions.hostname,
    listhenOptions.public
  );
  const _localhost = isLocalhost(listhenOptions.hostname);
  const _anyhost = isAnyhost(listhenOptions.hostname);
  if (listhenOptions.public && _localhost) {
    consola__default.warn(
      `[listhen] Trying to listhen on private host ${JSON.stringify(
        listhenOptions.hostname
      )} with public option enabled.`
    );
    listhenOptions.public = false;
  } else if (!listhenOptions.public && _anyhost && !(isWsl() || isDocker())) {
    consola__default.warn(
      `[listhen] Trying to listhen on public host ${JSON.stringify(
        listhenOptions.hostname
      )} with public option disabled. Using "localhost".`
    );
    listhenOptions.public = false;
    listhenOptions.hostname = "localhost";
  }
  if (listhenOptions.isTest) {
    listhenOptions.showURL = false;
  }
  if (listhenOptions.isProd || listhenOptions.isTest) {
    listhenOptions.open = false;
    listhenOptions.clipboard = false;
  }
  const port = listhenOptions.port = await getPortPlease.getPort({
    port: Number(listhenOptions.port),
    verbose: !listhenOptions.isTest,
    host: listhenOptions.hostname,
    alternativePortRange: [3e3, 3100],
    public: listhenOptions.public,
    ...typeof listhenOptions.port === "object" && listhenOptions.port
  });
  let server;
  const serverOptions = listhenOptions.socket ? { path: getSocketPath(listhenOptions.socket) } : { port, host: listhenOptions.hostname };
  let https = false;
  const httpsOptions = listhenOptions.https;
  let _addr;
  if (httpsOptions) {
    https = await resolveCertificate(httpsOptions);
    server = node_https.createServer(https, handle);
    addShutdown__default(server);
    await node_util.promisify(server.listen.bind(server))(serverOptions);
    _addr = server.address();
    listhenOptions.port = _addr.port;
  } else {
    server = node_http.createServer(handle);
    addShutdown__default(server);
    await node_util.promisify(server.listen.bind(server))(serverOptions);
    _addr = server.address();
    listhenOptions.port = _addr.port;
  }
  const getURL = (host = listhenOptions.hostname, baseURL) => serverOptions.path ? `unix+http${listhenOptions.https ? "s" : ""}://${serverOptions.path}` : generateURL(host, listhenOptions, baseURL);
  let tunnel;
  if (listhenOptions.tunnel) {
    const { startTunnel } = await import('untun');
    tunnel = await startTunnel({
      url: getURL("localhost")
    });
  }
  let _closed = false;
  const close = async () => {
    if (_closed) {
      return;
    }
    _closed = true;
    await node_util.promisify(server.shutdown)().catch(() => {
    });
    await tunnel?.close().catch(() => {
    });
  };
  if (listhenOptions.clipboard) {
    const clipboardy = await import('clipboardy').then((r) => r.default || r);
    await clipboardy.write(getURL()).catch(() => {
      listhenOptions.clipboard = false;
    });
  }
  const getURLs = async (getURLOptions = {}) => {
    const urls = [];
    const _addURL = (type, url) => {
      if (!urls.some((u) => u.url === url)) {
        urls.push({
          url,
          type
        });
      }
    };
    if (serverOptions.path) {
      _addURL("local", serverOptions.path);
      return urls;
    }
    const publicURL = getURLOptions.publicURL || getPublicURL(listhenOptions, getURLOptions.baseURL);
    if (publicURL) {
      _addURL("network", publicURL);
    }
    if (_localhost || _anyhost) {
      _addURL(
        "local",
        getURL(listhenOptions.hostname || "localhost", getURLOptions.baseURL)
      );
    }
    if (tunnel) {
      _addURL("tunnel", await tunnel.getURL());
    }
    if (listhenOptions.public) {
      const _ipv6Host = listhenOptions.hostname.includes(":");
      for (const addr of getNetworkInterfaces(_ipv6Host)) {
        if (addr === publicURL) {
          continue;
        }
        _addURL("network", getURL(addr, getURLOptions.baseURL));
      }
    }
    return urls;
  };
  const showURL = async (showURLOptions = {}) => {
    const lines = [];
    const nameSuffix = showURLOptions.name || listhenOptions.name ? ` (${showURLOptions.name || listhenOptions.name})` : "";
    const urls = await getURLs(showURLOptions);
    const firstLocalUrl = urls.find((u) => u.type === "local");
    const firstPublicUrl = urls.find((u) => u.type !== "local");
    const showQR = (showURLOptions.qr ?? listhenOptions.qr) !== false;
    if (firstPublicUrl && showQR) {
      const space = " ".repeat(14);
      lines.push(" ");
      lines.push(
        ...uqr.renderUnicodeCompact(firstPublicUrl.url).split("\n").map((line) => space + line)
      );
      lines.push(" ");
    }
    const typeMap = {
      local: ["Local", "green"],
      tunnel: ["Tunnel", "yellow"],
      network: ["Network", "magenta"]
    };
    for (const url of urls) {
      const type = typeMap[url.type];
      let infix = "";
      if (listhenOptions.socket && url.type === "local") {
        infix = listhenOptions.https ? " (https)" : " (http)";
      }
      const label = utils.getColor(type[1])(
        `  \u279C ${(type[0] + infix + ":").padEnd(8, " ")}${nameSuffix} `
      );
      let suffix = "";
      if (url === firstLocalUrl && listhenOptions.clipboard) {
        suffix += utils.colors.gray(" [copied to clipboard]");
      }
      if (url === firstPublicUrl && showQR) {
        suffix += utils.colors.gray(" [QR code]");
      }
      lines.push(`${label} ${formatURL(url.url)}${suffix}`);
    }
    if (!firstPublicUrl && !listhenOptions.socket) {
      lines.push(
        utils.colors.gray(`  \u279C Network:  use ${utils.colors.white("--host")} to expose`)
      );
    }
    console.log("\n" + lines.join("\n") + "\n");
  };
  if (listhenOptions.showURL) {
    showURL();
  }
  const _open = async () => {
    await open(getURL()).catch(() => {
    });
  };
  if (listhenOptions.open) {
    await _open();
  }
  if (listhenOptions.autoClose) {
    process.setMaxListeners(0);
    process.once("exit", () => close());
    process.once("SIGINT", () => process.exit(0));
    process.once("SIGTERM", () => process.exit(0));
    process.once("SIGHUP", () => process.exit(0));
  }
  return {
    url: getURL(),
    https,
    server,
    address: _addr,
    open: _open,
    showURL,
    getURLs,
    close
  };
}

async function createResolver() {
  const jiti = await import('jiti').then((r) => r.default || r);
  const _jitiRequire = jiti(process.cwd(), {
    cache: true,
    esmResolve: true,
    requireCache: false,
    interopDefault: true
  });
  const _import = (id) => {
    const r = _jitiRequire(id);
    return Promise.resolve(r.default || r);
  };
  const resolve = (id) => _jitiRequire.resolve(id);
  const tryResolve = (id) => {
    try {
      return resolve(id);
    } catch {
    }
  };
  return {
    relative: (path) => node_path.relative(process.cwd(), path),
    formateRelative: (path) => `\`./${node_path.relative(process.cwd(), path)}\``,
    import: _import,
    resolve,
    tryResolve
  };
}

async function createDevServer(entry, options) {
  const logger = options.logger || consola.consola.withTag("listhen");
  const h3Entry = await mlly.resolvePath("h3", {
    url: [options.cwd, process.cwd(), (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href))].filter(Boolean)
  });
  const {
    createApp,
    fromNodeMiddleware,
    serveStatic,
    eventHandler,
    dynamicEventHandler,
    toNodeListener
  } = await import(h3Entry);
  const resolver = await createResolver();
  const resolveEntry = () => {
    for (const suffix of ["", "/server/src", "/server", "/src"]) {
      const resolved = resolver.tryResolve(entry + suffix);
      if (resolved) {
        return resolved;
      }
    }
  };
  let cwd = options.cwd || "";
  if (!cwd) {
    const resolvedEntry = resolveEntry() || pathe.resolve(process.cwd(), entry);
    cwd = fs.statSync(resolvedEntry, { throwIfNoEntry: false })?.isDirectory() ? resolvedEntry : pathe.dirname(resolvedEntry);
  }
  const app = createApp();
  const staticDirs = (options.staticDirs || ["public"]).filter(Boolean).map((d) => pathe.resolve(cwd, d)).filter((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());
  for (const dir of staticDirs) {
    app.use(
      eventHandler(async (event) => {
        await serveStatic(event, {
          fallthrough: true,
          getContents: (id) => promises.readFile(pathe.join(dir, id)),
          getMeta: async (id) => {
            const stats = await promises.stat(pathe.join(dir, id)).catch(() => {
            });
            if (!stats || !stats.isFile()) {
              return;
            }
            return {
              size: stats.size,
              mtime: stats.mtimeMs
            };
          }
        });
      })
    );
  }
  let error;
  app.use(
    eventHandler(() => {
      if (error) {
        return errorTemplate(String(error), error.stack);
      }
    })
  );
  const dynamicHandler = dynamicEventHandler(() => {
    return `<!DOCTYPE html><html lang="en-US"><meta http-equiv="refresh" content="1"></head><body><p>Server is loading...</p>`;
  });
  app.use(dynamicHandler);
  let loadTime = 0;
  const loadHandle = async (initial) => {
    if (initial) {
      for (const dir of staticDirs) {
        logger.log(
          `\u{1F4C1} Serving static files from ${resolver.formateRelative(dir)}`
        );
      }
    }
    const start = Date.now();
    try {
      const _entry = resolveEntry();
      if (!_entry) {
        const message = `Cannot find a server entry in ${entry}`;
        logger.warn(message);
        error = new Error(message);
        error.stack = "";
        return;
      }
      if (initial) {
        logger.log(
          `\u{1F680} Loading server entry ${resolver.formateRelative(_entry)}`
        );
      }
      let _handler = await resolver.import(_entry).then((r) => r.handler || r.handle || r.app || r.default || r);
      if (_handler.handler) {
        _handler = _handler.handler;
      }
      if (typeof _handler !== "function") {
        throw new TypeError(
          "Make sure your server entrypoint exports a compatible `handler`, `handle`, `app` or `default` function export."
        );
      }
      dynamicHandler.set(fromNodeMiddleware(_handler));
      error = void 0;
    } catch (_error) {
      error = normalizeErrorStack(_error);
    }
    loadTime = Date.now() - start;
    if (error) {
      logger.error(error);
    } else {
      logger.log(
        `\u2705 Server ${initial ? "initialized" : "reloaded"} in ${loadTime}ms`
      );
    }
  };
  return {
    cwd,
    resolver,
    nodeListener: toNodeListener(app),
    reload: (_initial) => loadHandle(_initial),
    _entry: resolveEntry()
  };
}
const InternalStackRe = /jiti|node:internal|citty|listhen|listenAndWatch/;
function normalizeErrorStack(error) {
  if (process.env.DEBUG) {
    return error;
  }
  try {
    const cwd = process.cwd();
    error.stack = error.stack.split("\n").slice(1).map((l) => l.replace(cwd, ".")).filter((l) => !InternalStackRe.test(l)).join("\n");
  } catch {
  }
  return error;
}
function errorTemplate(message, stack = "") {
  return `<!DOCTYPE html>
  <html>
  <head>
  <title>Server Error</title>
  <meta charset="utf-8">
  <meta content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" name=viewport>
  <style>
  .error-page {
    padding: 1rem;
    background: #222;
    color: #fff;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: sans-serif;
    font-weight: 100 !important;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .error-page .error {
    max-width: 450px;
  }

  .error-page .title {
    font-size: 1rem;
    margin-top: 15px;
    color: #fff;
    margin-bottom: 8px;
  }

  .error-page .description {
    color: #ccc;
    line-height: 1.2;
    margin-bottom: 10px;
    text-align: left;
  }

  .error-page a {
    color: #ccc !important;
    text-decoration: none;
  }
  </style>
  </head>
  <body>
    <div class="error-page">
      <div class="error">
          <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="#DBE1EC" viewBox="0 0 48 48"><path d="M22 30h4v4h-4zm0-16h4v12h-4zm1.99-10C12.94 4 4 12.95 4 24s8.94 20 19.99 20S44 35.05 44 24 35.04 4 23.99 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z"/></svg>
          <div class="title">Server Error</div>
          <div class="description">${message}<pre>${stack}</pre></div>
      </div>
    </div>
  </body>
  </html>`;
}

async function listenAndWatch(entry, options) {
  const logger = options.logger || consola.consola.withTag("listhen");
  let watcher;
  const devServer = await createDevServer(entry, {
    cwd: options.cwd,
    logger
  });
  const listenter = await listen(devServer.nodeListener, {
    ...options,
    _entry: devServer._entry
  });
  await devServer.reload(true);
  const _close = listenter.close;
  listenter.close = async () => {
    if (watcher) {
      await watcher.unsubscribe().catch((error) => {
        logger.error(error);
      });
    }
    await _close();
  };
  try {
    const subscribe = await import('@parcel/watcher').then((r) => r.subscribe).catch(() => import('@parcel/watcher-wasm').then((r) => r.subscribe));
    const jsExts = /* @__PURE__ */ new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]);
    watcher = await subscribe(
      devServer.cwd,
      (_error, events) => {
        const filteredEvents = events.filter(
          (e) => jsExts.has(node_path.extname(e.path))
        );
        if (filteredEvents.length === 0) {
          return;
        }
        const eventsString = filteredEvents.map(
          (e) => `${devServer.resolver.formateRelative(e.path)} ${e.type}d`
        ).join(", ");
        logger.log(`\u{1F504} Reloading server (${eventsString})`);
        devServer.reload();
      },
      {
        ignore: options.ignore || [
          "**/.git/**",
          "**/node_modules/**",
          "**/dist/**"
        ]
      }
    );
    logger.log(
      `\u{1F440} Watching ${devServer.resolver.formateRelative(
        devServer.cwd
      )} for changes`
    );
  } catch (error) {
    logger.warn(
      "Cannot start the watcher!\n",
      error,
      "\n\n\u2714\uFE0F Your dev server is still running, but it won't reload automatically after changes. You need to restart it manually."
    );
  }
  return listenter;
}

exports.createDevServer = createDevServer;
exports.listen = listen;
exports.listenAndWatch = listenAndWatch;