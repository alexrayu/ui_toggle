<?php

namespace Drupal\ui_toggle\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\Component\Serialization\Json;

/**
 * Class CustomizeController.
 *
 * @package Drupal\ui_toggle\Controller
 */
class CustomizeController extends ControllerBase {

  /**
   * Drupal\Core\Config\ConfigFactory definition.
   *
   * @var \Drupal\Core\Config\ConfigFactory
   */
  protected $configFactory;

  /**
   * {@inheritdoc}
   */
  public function __construct(ConfigFactory $config_factory) {
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory')
    );
  }

  /**
   * Ajax. Interact with states storage.
   *
   * @return JsonResponse
   */
  public function ajax() {
    $request = \Drupal::request();
    $data = Json::decode($request->getContent());
    if (empty($data) && !empty($_GET)) {
      $data = $_GET;
    }
    if (empty($data)) {
      return new JsonResponse(['error' => 'No data']);
    }
    $response = [];

    // Switch by command.
    if (!empty($data['command'])) {
      switch ($data['command']) {
        case 'checkIsCustomizable':
          $response = [
            'result' => $this->configFactory->getEditable('ui_toggle.tags')->get($data['hid']),
          ];
          break;
        case 'saveUser':
        case 'savePreset':
          $response = $this->saveLayout($data);
          break;
      }
    }

    return new JsonResponse($response);
  }

  /**
   * @param $data
   *  The whole ajax object
   * @return array
   *  Status variable.
   */
  protected function saveLayout(&$data) {
    $db = \Drupal::database();
    $uid = \Drupal::currentUser()->id();
    $state = [];

    // If saving a preset.
    if ($data['command'] == 'savePreset') {
      $uid = 0;

      // Must have permissions if saving a preset.
      if (!\Drupal::currentUser()->hasPermission('ui_toggle_tag')) {
        return ['error' => 'Unauthorized'];
      }
    }

    foreach ($data['elements'] as $element) {
      if (!empty($element['value'])) {
        $state[$element['id']] = 1;
      }
    }

    $setup = $db->select('ui_toggle', 'h')
      ->fields('h', ['uid'])
      ->condition('uid', $uid)
      ->condition('hid', $data['hid'])
      ->countQuery()
      ->execute()
      ->fetchField();

    // Write to db.
    if ($setup == 0) {
      $setup = [
        'hid' => $data['hid'],
        'uid' => $uid,
        'data' => serialize($state),
      ];
      $db->insert('ui_toggle')->fields($setup)->execute();
    }
    else {
      $db->update('ui_toggle')
        ->fields(['data' => serialize($state)])
        ->condition('uid', $uid)
        ->condition('hid', $data['hid'])
        ->execute();
    }

    return ['success' => 1];
  }

}
