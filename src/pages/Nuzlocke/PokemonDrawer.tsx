import React from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { Drawer, Button, Spinner } from '@blueprintjs/core';
import { loader } from 'graphql.macro';
import { Formik, Form, Field } from 'formik';

import CustomInput from '../../components/Formik/CustomInput';
import CustomSelect from '../../components/Formik/CustomSelect';

import styles from './Nuzlocke.module.css';

const QUERY_GET_NUZLOCKE = loader('./queryGetNuzlocke.graphql');
const QUERY_ADD_POKEMON_DATA = loader('./queryAddPokemonData.graphql');
const MUTATION_UPDATE_POKEMON_STATUS = loader(
  './mutationUpdatePokemonStatus.graphql'
);
const MUTATION_DELETE_POKEMON = loader('./mutationDeletePokemon.graphql');

interface PokemonDrawerProps {
  onClose: () => void;
  isOpen: boolean;
  pokemon: {
    _id: string;
    nickname: string;
    location: string;
    status: string;
    pokemon: {
      _id: number;
      name: string;
      image: string;
    };
    partner: {
      _id: number;
      name: string;
      image: string;
    };
  };
  nuzlocke: {
    _id: string;
    type: string;
  };
  regionId: string;
  gameId: string;
}

interface PokemonDataProps {
  pokemons: {
    _id: string;
    name: string;
    sprite: string;
  }[];
  region: {
    locations: string[];
  };
}

const PokemonDrawer = ({
  pokemon,
  nuzlocke,
  regionId,
  onClose,
  gameId,
  isOpen
}: PokemonDrawerProps) => {
  const { data, loading } = useQuery<PokemonDataProps, any>(
    QUERY_ADD_POKEMON_DATA,
    {
      variables: {
        regionId,
        gameId
      },
      skip: !isOpen
    }
  );
  const [updatePokemon, { loading: updateLoading }] = useMutation(
    MUTATION_UPDATE_POKEMON_STATUS
  );
  const [deletePokemon, { loading: deleteLoading }] = useMutation(
    MUTATION_DELETE_POKEMON
  );

  if (!pokemon) {
    return null;
  }
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size={Drawer.SIZE_SMALL}
      title='Edit Pokemon'
    >
      {loading || !data ? (
        <div className={styles.EditPokemonForm}>
          <Spinner />
        </div>
      ) : (
        <Formik
          initialValues={{
            id: pokemon._id,
            nickname: pokemon.nickname,
            location: pokemon.location,
            status: pokemon.status,
            partner: nuzlocke.type === 'SOUL_LINK' ? pokemon.partner._id : null
          }}
          onSubmit={async values => {
            await updatePokemon({
              variables: {
                id: nuzlocke._id,
                pokemon: {
                  id: pokemon._id,
                  pokemon: pokemon.pokemon._id,
                  ...values
                }
              }
            });
            onClose();
          }}
        >
          {() => (
            <Form className={styles.EditPokemonForm}>
              <img src={pokemon.pokemon.image} alt='pokemon' />
              <Field
                id='nickname'
                name='nickname'
                label='Nickname'
                component={CustomInput}
              />
              <Field
                id='location'
                name='location'
                label='Location'
                component={CustomInput}
              />
              <Field
                id='status'
                name='status'
                component={CustomSelect}
                label='Status'
                placeholder='Select a Status'
                options={[
                  {
                    value: 'IN_TEAM',
                    label: 'in team'
                  },
                  {
                    value: 'IN_PC',
                    label: 'in pc'
                  },
                  {
                    value: 'SEEN',
                    label: 'seen'
                  },
                  {
                    value: 'DEAD',
                    label: 'Dead'
                  }
                ]}
              />
              {nuzlocke.type === 'SOUL_LINK' && (
                <Field
                  id='partner'
                  name='partner'
                  label='Soulink partner'
                  component={CustomSelect}
                  initialContent={null}
                  options={data.pokemons.map(pokemon => ({
                    value: pokemon._id,
                    label: pokemon.name,
                    icon: pokemon.sprite
                  }))}
                />
              )}
              <div className={styles.PokemonDrawerButtons}>
                <Button
                  type='submit'
                  intent='success'
                  loading={updateLoading}
                  large
                  rightIcon='floppy-disk'
                >
                  Save
                </Button>
                <Button
                  intent='danger'
                  onClick={async () => {
                    await deletePokemon({
                      variables: {
                        id: nuzlocke._id,
                        pokemonId: pokemon._id
                      },
                      update: (store, { data: { deletePokemon } }) => {
                        const data: any = store.readQuery({
                          query: QUERY_GET_NUZLOCKE,
                          variables: {
                            id: nuzlocke._id
                          }
                        });
                        data.nuzlocke.pokemons = data.nuzlocke.pokemons.filter(
                          (pok: any) => pok._id !== deletePokemon
                        );
                        store.writeQuery({
                          query: QUERY_GET_NUZLOCKE,
                          data
                        });
                      }
                    });
                    onClose();
                  }}
                  loading={deleteLoading}
                  small
                  minimal
                >
                  Delete
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </Drawer>
  );
};

export default PokemonDrawer;
