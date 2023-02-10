/*
 * pwix:roles/src/server/js/webapp.js
 *
 * See https://stackoverflow.com/questions/75402993/does-serving-static-files-from-multiple-routes-in-meteor-implies-to-multiply-pu/75408168#75408168
 */

// returns true if the url has been redirected (so it is no worth to try others redirecters)
const _redirect = function( url, stringIdentifier ){
    const indexOf = url.indexOf( stringIdentifier );
    if( indexOf > 0 ){
        const newurl = url.substring( indexOf );
        console.log( 'webapp redirect', url, 'to', newurl );
        res.writeHead( 301, {
            Location: newurl
        });
        res.end();
        return true;
    }
    return false;
}

WebApp.connectHandlers.use( function( req, res, next ){
    if( !_redirect( req.url, '/jstree/' )){
        next();
    }
});
