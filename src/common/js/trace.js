/*
 * pwix:roles/src/common/js/trace.js
 */

_verbose = function( level ){
    if( Roles.configure().verbosity & level ){
        let args = [ ...arguments ];
        args.shift();
        console.debug( ...args );
    }
};

_trace = function( functionName ){
    _verbose( Roles.C.Verbose.FUNCTIONS, ...arguments );
};
