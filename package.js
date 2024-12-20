Package.describe({
    name: 'pwix:roles',
    version: '1.7.0',
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
    api.use( 'pwix:accounts-hub@1.0.0' );
    api.use( 'pwix:bootbox@1.5.0' );
    api.use( 'pwix:i18n@1.5.7' );
    api.use( 'pwix:jstree@1.0.6' );
    api.use( 'pwix:modal@1.10.0 || 2.0.0' );
    api.use( 'pwix:plus-button@1.0.0' );
    api.use( 'pwix:tabbed@1.0.0-rc' );
    api.use( 'pwix:tolert@1.5.0' );
    api.use( 'pwix:ui-bootstrap5@2.0.0' );
    api.use( 'pwix:ui-fontawesome6@1.0.0' );
    api.use( 'pwix:ui-utils@1.0.0' );
    api.use( 'reactive-dict' );
    api.use( 'reactive-var' );
    api.use( 'tmeasday:check-npm-versions@1.0.2 || 2.0.0-beta.0', 'server' );
    api.use( 'tracker' );
    api.addFiles( 'src/client/components/prScopedAccountsPanel/prScopedAccountsPanel.js', 'client' );
    api.addFiles( 'src/client/components/prEdit/prEdit.js', 'client' );
    api.addFiles( 'src/client/components/prEditPanel/prEditPanel.js', 'client' );
    api.addFiles( 'src/client/components/prView/prView.js', 'client' );
    api.addFiles( 'src/client/components/prViewPanel/prViewPanel.js', 'client' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies
