Package.describe({
    name: 'pwix:roles',
    version: '1.3.1-rc',
    summary: 'An encapsulation of alanning:roles',
    git: 'https://github.com/trychlos/pwix-roles',
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.export([
        'Roles'
    ]);
    api.mainModule( 'src/client/js/index.js', 'client' );
    api.mainModule( 'src/server/js/index.js', 'server' );
});

Package.onTest( function( api ){
    configure( api );
    api.use( 'tinytest' );
    api.use( 'pwix:roles' );
    api.mainModule( 'test/js/index.js' );
});

function configure( api ){
    api.versionsFrom([ '2.9.0', '3.0-rc.0' ]);
    api.use( 'alanning:roles@3.4.0 || 4.0.0-alpha.0' );
    api.use( 'blaze-html-templates@2.0.0 || 3.0.0-alpha300.0', 'client' );
    api.use( 'ecmascript' );
    api.use( 'less@4.0.0', 'client' );
    api.use( 'mongo', 'server' );
    api.use( 'pwix:i18n@1.5.7' );
    api.use( 'pwix:jstree@1.0.6' );
    api.use( 'pwix:modal@1.10.0' );
    api.use( 'tmeasday:check-npm-versions@1.0.2 || 2.0.0-beta.0', 'server' );
    api.addFiles( 'src/client/components/prEdit/prEdit.js', 'client' );
    api.addFiles( 'src/client/components/prEditPanel/prEditPanel.js', 'client' );
    api.addFiles( 'src/client/components/prView/prView.js', 'client' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies
