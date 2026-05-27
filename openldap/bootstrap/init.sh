#!/bin/bash

log() {
  echo -e "[OpenLDAP Bootstrap][$(date +'%Y-%m-%d %H:%M:%S')] $1\n"
}

log "Starting LDAP bootstrap process..."

# Ожидание загрузки LDAP сервера
until ldapwhoami -x -H ldap://openldap:389 -D "cn=admin,$BASE_DN" -w "$ADMIN_PASS"; do
  sleep 1
done

# Загрузка данных из LDIF файла
ldapadd -x -H ldap://openldap:389 -D "cn=admin,$BASE_DN" -w "$ADMIN_PASS" -f /bootstrap/init.ldif

rc=$?

if [ $rc -eq 0 ]; then
  log "Bootstrap completed successfully."
elif [ $rc -eq 68 ]; then
  log "Bootstrap skipped: entry already exists."
else
  log "Bootstrap failed with error code $rc."
fi
