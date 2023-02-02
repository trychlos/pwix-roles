Package.describe({
    name: 'pwix:roles',
    version: '1.0.0',
    summary: 'An encapsulation of alanning:roles',
    git: '',
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.export([
        'pwiRoles'
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
    api.use( 'alanning:roles', 'server' );
    api.use( 'blaze-html-templates', 'client' );
    api.use( 'ecmascript' );
    api.use( 'less', 'client' );
    api.use( 'mongo', 'server' );
    api.use( 'pwix:i18n' );
    api.use( 'pwi:string-prototype' );
    api.addFiles( 'src/client/components/prRolesEdit/prRolesEdit.js', 'client' );
    api.addFiles( 'src/client/components/prRolesView/prRolesView.js', 'client' );
}

Npm.depends({
    bootstrap: '5.2.1',
    jstree: '3.3.12',
    uuid: '9.0.0'
});
