Pod::Spec.new do |s|
  s.name           = 'HwpTransport'
  s.version        = '0.1.0'
  s.summary        = 'Per-instance panel HTTP transport for HWPanel.'
  s.description    = 'URLSession transport whose self-signed certificate trust is scoped to an explicit host:port.'
  s.author         = ''
  s.homepage       = 'https://github.com/HW618/HWPanel-Client'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
