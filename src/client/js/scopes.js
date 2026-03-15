/*
 * pwix:roles/src/client/js/scopes.js
 *
 * Try to provides labels to scopes.
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

const logger = Logger.get();

Roles.scopes = {
    labels: new ReactiveDict(),
    // a subcription to the used scopes
    handle: null,
    collection: null,

    // returns the label
    label( id ){
        let label = Roles.scopes.labels.get( id );
        if( !label ){
            let promises = [];
            const scopeLabelFn = Roles.configure().scopeLabelFn;
            if( scopeLabelFn && typeof scopeLabelFn === 'function' ){
                promises.push( scopeLabelFn( id ).then(( res ) => {
                    if( res && _.isString( res )){
                        label = res;
                        Roles.scopes.label.set( id, res );
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
Tracker.autorun(() => {
    if( Roles.ready()){
        Tracker.nonreactive(() => {
            const scopesFn = Roles.configure().scopesFn;
            if( scopesFn && _.isFunction( scopesFn )){
                scopesFn().then(( res ) => {
                    res = _.isArray( res ) ? res : [res];
                    res.forEach(( it ) => {
                        if( _.isString( it )){
                            Roles.scopes.labels.set( it, null );
                        } else if( _.isObject( it ) && it._id ){
                            Roles.scopes.labels.set( it._id, it.label || null );
                        } else {
                            logger.warn( 'expect a { _id, label } object, found', it );
                        }
                    });
                });
            } else {
                const scopesPub = Roles.configure().scopesPub || 'pwix.Roles.p.usedScopes';
                Roles.scopes.handle = Meteor.subscribe( scopesPub );
                Roles.scopes.collection = new Mongo.Collection( 'pwix_roles_used_scopes' );
            }
            // if we have subscribed to a publication ?
            if( Roles.scopes.handle ){
                Tracker.autorun(() => {
                    if( Roles.scopes.handle.ready()){
                        Roles.scopes.collection.find().fetchAsync().then(( fetched ) => {
                            Roles.scopes.labels.clear();
                            fetched.forEach(( it ) => {
                                Roles.scopes.labels.set( it._id, it.label || null );
                            });
                        });
                    }
                });
            }
        });
    }
});

// track the scopes list
Tracker.autorun(() => {
    logger.debug( 'scopes', Roles.scopes.labels.all());
});
