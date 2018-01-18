<?php

namespace Drupal\ui_toggle\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\Component\Serialization\Json;

/**
 * Class TagController.
 *
 * @package Drupal\ui_toggle\Controller
 */
class TagController extends ControllerBase {

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
   * @return object
   *   JsonResponse.
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
      }
    }
    // Switch by control type.
    elseif (!empty($data['type'])) {
      switch ($data['type']) {
        case 'tag':
          $response = $this->saveTag($data);
          break;
      }
    }

    return new JsonResponse($response);
  }

  /**
   * Save the tag.
   *
   * @param array $data
   *   The whole ajax object.
   *
   * @return array
   *   Status variable.
   */
  protected function saveTag(array &$data) {
    $config = $this->configFactory->getEditable('ui_toggle.tags');
    $tag_value = $data['value'] === TRUE ? 1 : 0;
    $config->set($data['hid'], $tag_value)->save();

    return ['success' => 1];
  }

  /**
   * Check if form is customizable.
   *
   * @param string $hid
   *   Handle id.
   *
   * @return string
   *   Handle id.
   */
  protected function checkFormCustomizable($hid) {
    $config = $this->configFactory->getEditable('ui_toggle.tags')->get($hid);

    return $config->get($hid);
  }

}
