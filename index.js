var send = require('peer-file/send')
var receive = require('peer-file/receive')
var state = require('history-state')({ hash: true })
var peer = require('peerjs')(null, { key: '5eqjv36bbwamunmi' })
var form, label, input, p, you

peer.on('open', function(id) {
  you = id

  p = document.createElement('p')
  form = document.createElement('form')
  label = document.createElement('label')
  input = document.createElement('input')
  input.type = 'file'
  input.id = 'id-' + you
  input.style.display = 'none'
  label.setAttribute('for', input.id)

  if (!location.hash) {
    var url = location.href.replace(/^([^#]+).*$/,
      function(match, $1) {
        return $1 + '#' + you
      })

    p.innerHTML = 'Give this URL to someone: ' + url.link(url)
  }

  form.appendChild(label)
  form.appendChild(input)
  document.body.appendChild(p)
  document.body.appendChild(form)
})

var init = function(connection) {
  connection.on('open', function() {
    label.textContent = 'Send a file to ' + connection.peer
    p.innerHTML = ''
    input.style.display = 'block'


    // Receive
    receive(connection)
      .on('incoming', function(file) {
        confirm('About to download “' + file.name + '”') ?
          this.accept(file) :
          this.reject(file)
      })
      .on('progress', function(file, bytesReceived) {
        var percentage = Math.ceil(bytesReceived / file.size * 100)
        p.textContent = 'Downloaded ' + percentage + '% of “' + file.name + '”'
      })
      .on('complete', function(file) {
        var binary = new Blob(file.data, { type: file.type })
        var href = (URL || webkitURL).createObjectURL(binary)
        var anchor = document.createElement('a')
        setTimeout(function() {
          p.innerHTML = 'Download '
          anchor.href = href
          anchor.target = '_blank'
          anchor.textContent = file.name
          p.appendChild(anchor)
        })
      })

    // Send 
    input.onchange = function() {
      var file = input.files[0]
      send(connection, file)
        .on('progress', function(bytesSent) {
          var percentage = Math.ceil(bytesSent / file.size * 100)
          p.textContent = 'Sent ' + percentage + '% of “' + file.name + '”'
        })
      form.reset()
    }
  })
}

peer.on('connection', init)

state.on('change', function() {
  var id = location.hash.replace(/^#/, '')
  if (id && id !== you) {
    init(peer.connect(id))
  }
})
