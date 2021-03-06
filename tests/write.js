var os = require('os')
var fs = require('fs')
var path = require('path')
var test = require('tape')
var spawn = require('tape-spawn')
var helpers = require('./helpers')

var tmp = os.tmpdir()
var dat = path.resolve(__dirname + '/../cli.js')
var dat1 = path.join(tmp, 'dat-1')

helpers.onedat(dat1)

test('write: dat write errors without dataset', function (t) {
  var st = spawn(t, "echo 'hello world' | " + dat + ' write test-file.txt -', {cwd: dat1})
  st.stdout.empty()
  st.stderr.match(fs.readFileSync(path.join('usage', 'write.txt')).toString() + '\n', 'usage matched')
  st.end()
})

test('write: dat write to dataset', function (t) {
  var st = spawn(t, "echo 'hello world' | " + dat + ' write -d my-dataset test-file.txt -', {cwd: dat1})
  st.stdout.empty()
  st.stderr.match(/Done writing binary data/)
  st.end()
})

test('write: dat read after write to dataset', function (t) {
  datReadEquals(t, 'test-file.txt', /hello world/, '-d my-dataset')
})

test('write: dat write to new dataset', function (t) {
  var st = spawn(t, "echo 'goodbye world' | " + dat + ' write -d my-dataset-2 test-file.txt -', {cwd: dat1})
  st.stdout.empty()
  st.stderr.match(/Done writing binary data/)
  st.end()
})

test('write: dat read after write to dataset 2', function (t) {
  datReadEquals(t, 'test-file.txt', /goodbye world/, '-d my-dataset-2')
})

test('write: dat overwrite to dataset 2', function (t) {
  var st = spawn(t, "echo 'goodbye mars' | " + dat + ' write -d my-dataset-2 test-file.txt -', {cwd: dat1})
  st.stdout.empty()
  st.stderr.match(/Done writing binary data/)
  st.end()
})

test('write: dat read after overwrite to dataset 2', function (t) {
  datReadEquals(t, 'test-file.txt', /goodbye mars/, '-d my-dataset-2')
})

/** from file **/

var blobPath = path.resolve(__dirname + '/fixtures/blob.txt')

test('write: dat write from file', function (t) {
  datWrite(t, blobPath, '-d my-dataset-2')
})

test('write: dat read after write from file', function (t) {
  var contents = fs.readFileSync(blobPath).toString()
  datReadEquals(t, blobPath, contents, '-d my-dataset-2')
})

test('write: dat write from file with new name', function (t) {
  datWrite(t, blobPath, '-d my-dataset-2 --name=new-name.txt')
})

test('write: dat read after write from file with new name', function (t) {
  var contents = fs.readFileSync(blobPath).toString()
  datReadEquals(t, 'new-name.txt', contents, '-d my-dataset-2')
})

test('write: dat write from file with new name with abbr', function (t) {
  datWrite(t, blobPath, '-d my-dataset-2 -n new-name-abbr.txt')
})

test('write: dat read after write from file with new name with abbr', function (t) {
  var contents = fs.readFileSync(blobPath).toString()
  datReadEquals(t, 'new-name-abbr.txt', contents, '-d my-dataset-2')
})

var dat2 = path.join(tmp, 'dat-2')

helpers.onedat(dat2)
helpers.fileConflict(dat1, dat2, 'files', 'plato-says-hey-yo', function (conflictForks) {
})

test('write: dat write after conflict', function (t) {
  datWrite(t, blobPath, '-d files --name=file.txt', dat1)
})
test('write: dat write after conflict', function (t) {
  var contents = fs.readFileSync(blobPath).toString()
  datReadEquals(t, 'file.txt', contents, '-d files', dat1)
})

test('write: dat read after conflict', function (t) {
  datReadEquals(t, 'plato-says-hey-yo', /goodbye mars/, '-d files', dat1)
})

test('write: dat read after conflict', function (t) {
  datReadEquals(t, 'plato-says-hey-yo', /hello mars/, '-d files', dat2)
})

function datWrite (t, blobPath, ext, myDat) {
  if (!myDat) myDat = dat1
  var cmd = ' write ' + blobPath
  if (ext) {
    cmd = cmd + ' ' + ext
  }
  var st = spawn(t, dat + cmd, {cwd: myDat})
  st.stdout.empty()
  st.stderr.match(/Done writing binary data/)
  st.end()
}

function datReadEquals (t, key, contents, ext, myDat) {
  if (!myDat) myDat = dat1
  var cmd = ' read ' + key
  if (ext) {
    cmd = cmd + ' ' + ext
  }
  var st = spawn(t, dat + cmd, {cwd: myDat})
  st.stderr.empty()
  st.stdout.match(contents)
  st.end()
}
