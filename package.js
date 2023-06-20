Package.describe({
    name: 'pwix:roles',
    version: '1.1.3-rc',
    summary: 'An encapsulation of alanning:roles',
    git: 'https://github.com/trychlos/pwix-roles',
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.export([
        'pwixRoles',
        'PR_VERBOSE_NONE',
        'PR_VERBOSE_CONFIGURE',
        'PR_VERBOSE_CURRENT',
        'PR_VERBOSE_MAINTAIN',
        'PR_VERBOSE_READY',
        'PR_VERBOSE_STARTUP',
        'PR_VERBOSE_VIEWADD'
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
    api.versionsFrom( '1.8.1' );
    api.use( 'alanning:roles@3.4.0', 'server' );
    api.use( 'blaze-html-templates@2.0.0', 'client' );
    api.use( 'ecmascript' );
    api.use( 'less@4.0.0', 'client' );
    api.use( 'mongo', 'server' );
    api.use( 'pwix:i18n@1.3.0' );
    api.use( 'pwix:jstree@1.0.3' );
    api.use( 'pwix:modal@1.5.0' );
    api.use( 'tmeasday:check-npm-versions@1.0.2', 'server' );
    api.addFiles( 'src/client/components/prEdit/prEdit.js', 'client' );
    api.addFiles( 'src/client/components/prView/prView.js', 'client' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies
