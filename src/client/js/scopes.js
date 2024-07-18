/*
 * pwix:roles/src/client/js/scopes.js
 *
 * Try to provides labels to scopes.
 */

import _ from 'lodash';

import { Mongo } from 'meteor/mongo';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

Roles._scopes = {
    labels: new ReactiveDict(),
    // a subcription to the used scopes
    handle: null,
    collection: null,

    // returns the label
    label( id ){
        let label = Roles._scopes.labels.get( id );
        if( !label ){
            let promises = [];
            const scopeLabelFn = Roles.configure().scopeLabelFn;
            if( scopeLabelFn && typeof scopeLabelFn === 'function' ){
                promises.push( scopeLabelFn( id ).then(( res ) => {
                    if( res && _.isString( res )){
                        label = res;
                        Roles._scopes.label.set( id, res );
                    }
                }));
            }
            Promise.allSettled( promises ).then(() => {
                // nothing to do here
            });
        }
        return label || id;
    }
};

// at startup time, tries to ask the application the list of available scopes
//  scopesFn expects an array of ids, or of objects { _id [, label] }
Meteor.startup(() => {
    const scopesFn = Roles.configure().scopesFn;
    if( scopesFn && typeof scopesFn === 'function' ){
        scopesFn().then(( res ) => {
            res = _.isArray( res ) ? res : [res];
            res.forEach(( it ) => {
                if( _.isString( it )){
                    Roles._scopes.labels.set( it, null );
                } else if( _.isObject( it ) && it._id ){
                    Roles._scopes.labels.set( it._id, it.label || null );
                } else {
                    console.warn( 'expect a { _id, label } object, found', it );
                }
            });
        });
    } else {
        const scopesPub = Roles.configure().scopesPub || 'pwix_roles_used_scopes';
        Roles._scopes.handle = Meteor.subscribe( scopesPub );
        Roles._scopes.collection = new Mongo.Collection( scopesPub );
    }
    // if we have subscribed to a publication ?
    if( Roles._scopes.handle ){
        Tracker.autorun(() => {
            if( Roles._scopes.handle.ready()){
                Roles._scopes.collection.find().fetchAsync().then(( fetched ) => {
                    //console.debug( 'fetched', fetched );
                    Roles._scopes.labels.clear();
                    fetched.forEach(( it ) => {
                        Roles._scopes.labels.set( it._id, it.label || null );
                    });
                });
            }
        });
    }
});

// track the scopes list
Tracker.autorun(() => {
    console.debug( 'scopes', Roles._scopes.labels.all());
});
